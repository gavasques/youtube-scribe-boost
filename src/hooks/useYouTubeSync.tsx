import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/core/Logger'

interface SyncOptions {
  type: 'full' | 'incremental'
  includeRegular: boolean
  includeShorts: boolean
  syncMetadata: boolean
  maxVideos?: number
  pageToken?: string
  syncAll?: boolean
}

interface SyncStats {
  processed: number
  new: number
  updated: number
  errors: number
  totalEstimated?: number
}

interface QuotaInfo {
  resetTime?: string
  requestsUsed?: number
  dailyLimit?: number
}

interface QuotaStatus {
  hasQuota: boolean
  quotaUsed: number
  quotaLimit: number
  resetTime?: string
  percentageUsed?: number
  remainingQuota?: number
  isExceeded: boolean
}

interface SyncProgress {
  step: string
  current: number
  total: number
  message: string
  errors?: string[]
  currentPage?: number
  totalPages?: number
  videosProcessed?: number
  totalVideosEstimated?: number
  quotaInfo?: QuotaInfo
}

interface SyncResult {
  stats: SyncStats
  errors?: string[]
  nextPageToken?: string
  hasMorePages: boolean
  currentPage: number
  totalPages?: number
  quotaInfo?: QuotaInfo
}

interface BatchSyncState {
  isRunning: boolean
  canPause: boolean
  isPaused: boolean
  totalStats: SyncStats
  allErrors: string[]
  pageToken?: string
}

// Rate Limiter mais conservador
class SimpleRateLimiter {
  private requests: number[] = []
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    if (this.requests.length >= this.maxRequests) {
      return false
    }
    
    this.requests.push(now)
    return true
  }

  getRemainingTime(): number {
    if (this.requests.length < this.maxRequests) return 0
    
    const oldestRequest = Math.min(...this.requests)
    return this.windowMs - (Date.now() - oldestRequest)
  }

  getRemainingRequests(): number {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return Math.max(0, this.maxRequests - this.requests.length)
  }
}

// Rate limiter muito conservador: 1 request a cada 10 minutos
const rateLimiter = new SimpleRateLimiter(1, 600000) // 10 minutos

// Cache para evitar requisições duplicadas
const syncCache = new Map<string, { result: any; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutos

// Função de sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ✅ FUNÇÃO MELHORADA: Verificar quota do YouTube com detecção de excesso
const checkYouTubeQuota = async (): Promise<QuotaStatus> => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('youtube_quota_usage')
      .select('*')
      .eq('date', today)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) {
      logger.warn('[QUOTA-CHECK] Erro ao verificar quota:', error)
      return { 
        hasQuota: true, 
        quotaUsed: 0, 
        quotaLimit: 10000,
        percentageUsed: 0,
        remainingQuota: 10000,
        isExceeded: false
      }
    }
    
    const quotaUsed = data?.requests_used || 0
    const quotaLimit = 10000 // YouTube API daily limit
    const percentageUsed = Math.round((quotaUsed / quotaLimit) * 100)
    const remainingQuota = quotaLimit - quotaUsed
    const isExceeded = quotaUsed >= quotaLimit
    
    const resetTime = data?.updated_at ? new Date(data.updated_at).toISOString() : undefined
    
    logger.info('[QUOTA-CHECK] Status detalhado da quota:', {
      quotaUsed: quotaUsed.toLocaleString(),
      quotaLimit: quotaLimit.toLocaleString(),
      percentageUsed: `${percentageUsed}%`,
      remainingQuota: remainingQuota.toLocaleString(),
      isExceeded,
      hasQuota: !isExceeded
    })
    
    return {
      hasQuota: !isExceeded,
      quotaUsed,
      quotaLimit,
      resetTime,
      percentageUsed,
      remainingQuota,
      isExceeded
    }
  } catch (error) {
    logger.error('[QUOTA-CHECK] Erro na verificação:', error)
    return { 
      hasQuota: true, 
      quotaUsed: 0, 
      quotaLimit: 10000,
      percentageUsed: 0,
      remainingQuota: 10000,
      isExceeded: false
    }
  }
}

export function useYouTubeSync() {
  const { toast } = useToast()
  
  // Estados
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [batchSync, setBatchSync] = useState<BatchSyncState>({
    isRunning: false,
    canPause: false,
    isPaused: false,
    totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
    allErrors: []
  })
  
  // Controles
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastRequestTimeRef = useRef<number>(0)
  const cacheRef = useRef(syncCache)
  const isProcessingRef = useRef(false)
  
  // ✅ FUNÇÃO MELHORADA: Sync com detecção aprimorada de quota excedida
  const performSync = useCallback(async (options: SyncOptions): Promise<SyncResult> => {
    logger.info('[YT-SYNC] Iniciando sincronização', { options })
    
    // 1. ✅ VERIFICAÇÃO DETALHADA DA QUOTA
    setProgress({
      step: 'quota_check',
      current: 0,
      total: 6,
      message: 'Verificando quota do YouTube API...'
    })
    
    const quotaStatus = await checkYouTubeQuota()
    logger.info('[YT-SYNC] Status da quota:', quotaStatus)
    
    // ✅ DETECÇÃO ESPECÍFICA DE QUOTA EXCEDIDA
    if (quotaStatus.isExceeded) {
      const resetTime = quotaStatus.resetTime ? 
        new Date(quotaStatus.resetTime).toLocaleString('pt-BR') : 
        'desconhecido'
      
      const message = `🚨 Quota do YouTube API excedida!
📊 Usado: ${quotaStatus.quotaUsed.toLocaleString()}/${quotaStatus.quotaLimit.toLocaleString()} (${quotaStatus.percentageUsed}%)
⏰ Reset diário às 00:00 UTC (próximo reset: ${resetTime})
💡 Aguarde o reset da quota ou solicite aumento no Google Cloud Console.`

      throw new Error(message)
    }
    
    if (!quotaStatus.hasQuota) {
      const resetTime = quotaStatus.resetTime ? 
        new Date(quotaStatus.resetTime).toLocaleString('pt-BR') : 
        'desconhecido'
      
      throw new Error(`Quota do YouTube API insuficiente (${quotaStatus.quotaUsed}/${quotaStatus.quotaLimit}). Reset em: ${resetTime}`)
    }
    
    // ✅ AVISO PREVENTIVO QUANDO QUOTA ESTÁ ALTA
    if (quotaStatus.percentageUsed && quotaStatus.percentageUsed >= 90) {
      logger.warn(`[YT-SYNC] ⚠️ Quota alta: ${quotaStatus.percentageUsed}% usada`)
      
      setProgress({
        step: 'quota_warning',
        current: 0,
        total: 6,
        message: `⚠️ Quota em ${quotaStatus.percentageUsed}% - Use com moderação (${quotaStatus.remainingQuota} requests restantes)`
      })
      
      // Aguardar 3 segundos para mostrar o aviso
      await sleep(3000)
    }
    
    // 2. Verificar rate limiting
    setProgress({
      step: 'rate_check',
      current: 1,
      total: 6,
      message: 'Verificando rate limiting...'
    })
    
    if (!rateLimiter.canMakeRequest()) {
      const remainingTime = rateLimiter.getRemainingTime()
      const waitMinutes = Math.ceil(remainingTime / 60000)
      throw new Error(`Rate limit atingido. Aguarde ${waitMinutes} minutos.`)
    }

    // 3. Verificar cache
    const cacheKey = JSON.stringify(options)
    const cached = cacheRef.current.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.info('[YT-SYNC] Usando cache', { cacheKey })
      return cached.result
    }

    // 4. Garantir intervalo mínimo entre requests
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTimeRef.current
    const minInterval = 120000 // 2 minutos mínimo

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest
      logger.info(`[YT-SYNC] Aguardando intervalo mínimo: ${waitTime}ms`)
      
      setProgress({
        step: 'waiting_interval',
        current: 2,
        total: 6,
        message: `Aguardando intervalo de segurança (${Math.ceil(waitTime / 1000)}s)...`
      })
      
      await sleep(waitTime)
    }

    lastRequestTimeRef.current = Date.now()

    // 5. Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // 6. ✅ Executar sync com detecção melhorada de quota e falso sucesso
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        logger.info(`[YT-SYNC] Tentativa ${attempt}/3`)
        
        setProgress({
          step: 'auth',
          current: 3,
          total: 6,
          message: `Verificando autenticação (${attempt}/3)...`
        })

        // Verificar autenticação
        const { data: authData, error: authError } = await supabase.auth.getSession()
        if (authError || !authData.session) {
          throw new Error('Usuário não autenticado')
        }

        setProgress({
          step: 'syncing',
          current: 4,
          total: 6,
          message: 'Sincronizando com YouTube...'
        })

        // Chamar Edge Function com timeout
        const controller = abortControllerRef.current
        const timeoutId = setTimeout(() => controller?.abort(), 180000) // 3 minutos

        try {
          const response = await supabase.functions.invoke('youtube-sync', {
            body: { 
              options,
              quotaCheck: quotaStatus // Enviar info da quota
            },
            headers: {
              'Authorization': `Bearer ${authData.session.access_token}`,
              'Content-Type': 'application/json'
            }
          })

          clearTimeout(timeoutId)

          logger.info('[YT-SYNC] Resposta da Edge Function:', {
            error: response.error?.message,
            dataPreview: response.data ? {
              hasStats: !!response.data.stats,
              statsProcessed: response.data.stats?.processed
            } : null
          })

          // ✅ FIX: Verificar erro na response corretamente
          if (response.error) {
            const errorMsg = response.error.message || 'Erro desconhecido'
            
            // ✅ DETECÇÃO ESPECÍFICA DE QUOTA EXCEDIDA NA RESPOSTA
            if (errorMsg.includes('quotaExceeded') || 
                errorMsg.includes('Daily Limit Exceeded') ||
                errorMsg.includes('quota') || 
                errorMsg.includes('Quota') ||
                errorMsg.includes('403')) {
              
              logger.error('[YT-SYNC] 🚨 Quota excedida detectada na resposta da API')
              throw new Error('🚨 Quota do YouTube API excedida. Aguarde o reset diário (00:00 UTC) ou solicite aumento da quota no Google Cloud Console.')
            }
            
            // ✅ Verificar se é erro 429
            if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
              throw new Error(`Rate limit do YouTube: ${errorMsg}`)
            }
            
            throw new Error(errorMsg)
          }

          const result = response.data as SyncResult

          // ✅ VALIDAÇÃO CRÍTICA: Verificar se realmente processou vídeos
          if (!result || !result.stats) {
            throw new Error('Resposta inválida da Edge Function - sem stats')
          }

          setProgress({
            step: 'validating',
            current: 5,
            total: 6,
            message: 'Validando resultados...'
          })

          // ✅ DETECÇÃO DE FALSO SUCESSO
          const { processed, new: newVideos, updated, errors: errorCount } = result.stats
          
          logger.info('[YT-SYNC] Estatísticas da sincronização:', {
            processed,
            new: newVideos,
            updated,
            errors: errorCount,
            hasErrors: result.errors?.length || 0
          })

          if (processed === 0 && newVideos === 0 && updated === 0) {
            logger.warn('[YT-SYNC] Possível falso sucesso detectado:', result)
            
            // Se não há erros reportados mas também não há vídeos processados
            if (!result.errors || result.errors.length === 0) {
              throw new Error(
                '🚨 Sincronização retornou sucesso mas não processou nenhum vídeo. ' +
                'Possível problema de quota, autenticação ou rate limiting no YouTube. ' +
                'Verifique se a quota não foi excedida.'
              )
            }
            
            // Se há erros, mostrar eles
            const errorSummary = result.errors.slice(0, 3).join('; ')
            throw new Error(
              `Sincronização falhou: ${errorSummary}` +
              (result.errors.length > 3 ? ` (e mais ${result.errors.length - 3} erros)` : '')
            )
          }

          setProgress({
            step: 'complete',
            current: 6,
            total: 6,
            message: `Sincronização concluída! ${processed} vídeos processados.`
          })

          // Salvar no cache apenas se realmente processou algo
          if (processed > 0) {
            cacheRef.current.set(cacheKey, {
              result,
              timestamp: Date.now()
            })
          }

          // Limpar cache antigo
          for (const [key, value] of cacheRef.current.entries()) {
            if (Date.now() - value.timestamp > CACHE_TTL) {
              cacheRef.current.delete(key)
            }
          }

          logger.info('[YT-SYNC] Sucesso confirmado:', {
            processed,
            new: newVideos,
            updated,
            errors: errorCount
          })
          
          return result

        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          throw fetchError
        }

      } catch (error: any) {
        lastError = error
        logger.error(`[YT-SYNC] Tentativa ${attempt} falhou:`, error.message)

        // ✅ DETECÇÃO ESPECÍFICA DE QUOTA EXCEDIDA
        if (error.message?.includes('quotaExceeded') || 
            error.message?.includes('Daily Limit Exceeded') ||
            error.message?.includes('quota') || 
            error.message?.includes('Quota') ||
            error.message?.includes('403')) {
          
          logger.error('[YT-SYNC] 🚨 Quota excedida detectada, não tentando novamente')
          throw new Error('🚨 Quota do YouTube API excedida. Aguarde o reset diário (00:00 UTC) ou solicite aumento da quota no Google Cloud Console.')
        }

        // ✅ Se é erro 429, aguardar MUITO mais tempo
        if (error.message?.includes('429') || 
            error.message?.includes('Too Many Requests') ||
            error.message?.includes('rate limit')) {
          
          if (attempt < 3) {
            // ✅ Delays MUITO maiores: 10min → 20min → 40min
            const delays = [600000, 1200000, 2400000] // 10min, 20min, 40min
            const delay = delays[attempt - 1]
            
            logger.info(`[YT-SYNC] Rate limit detectado. Aguardando ${delay / 1000}s`)
            
            setProgress({
              step: 'waiting_rate_limit',
              current: attempt + 2,
              total: 6,
              message: `Rate limit atingido. Aguardando ${Math.ceil(delay / 60000)} minutos...`
            })
            
            await sleep(delay)
            continue
          }
        }

        // Para outros erros, aguardar tempo moderado
        if (attempt < 3) {
          const delay = 60000 * attempt // 1min, 2min
          logger.info(`[YT-SYNC] Aguardando ${delay / 1000}s antes da próxima tentativa`)
          
          setProgress({
            step: 'retrying',
            current: attempt + 2,
            total: 6,
            message: `Erro encontrado. Tentando novamente em ${Math.ceil(delay / 1000)}s...`
          })
          
          await sleep(delay)
        }
      }
    }

    throw lastError || new Error('Falha após 3 tentativas')

  }, [])

  // ✅ NOVA FUNÇÃO: Verificar status da quota
  const checkQuotaStatus = useCallback(async (): Promise<QuotaStatus | null> => {
    try {
      return await checkYouTubeQuota()
    } catch (error) {
      logger.error('[QUOTA-STATUS] Erro:', error)
      return null
    }
  }, [])
  
  // Função principal de sync
  const startSync = useCallback(async (options: SyncOptions) => {
    if (syncing || isProcessingRef.current) {
      toast({
        title: "Sincronização em andamento",
        description: "Aguarde a sincronização atual terminar.",
        variant: "default"
      })
      return
    }
    
    if (!rateLimiter.canMakeRequest()) {
      const remainingTime = rateLimiter.getRemainingTime()
      const waitMinutes = Math.ceil(remainingTime / 60000)
      
      setError(`Rate limit atingido. Aguarde ${waitMinutes} minutos.`)
      toast({
        title: "Rate limit atingido",
        description: `Aguarde ${waitMinutes} minutos antes de tentar novamente.`,
        variant: "destructive"
      })
      return
    }
    
    isProcessingRef.current = true
    
    try {
      setSyncing(true)
      setError(null)
      setProgress({
        step: 'starting',
        current: 0,
        total: 6,
        message: 'Iniciando sincronização...'
      })
      
      const result = await performSync(options)
      
      setProgress({
        step: 'completed',
        current: 6,
        total: 6,
        message: 'Sincronização concluída com sucesso!'
      })
      
      toast({
        title: "Sincronização concluída",
        description: `${result.stats.processed} vídeos processados. ${result.stats.new} novos, ${result.stats.updated} atualizados.`,
        variant: "default"
      })
      
      return result
      
    } catch (error: any) {
      logger.error('[YT-SYNC] Erro na sincronização:', error.message)
      
      const errorMessage = error.message || 'Erro desconhecido na sincronização'
      setError(errorMessage)
      
      setProgress({
        step: 'error',
        current: 0,
        total: 6,
        message: `Erro: ${errorMessage}`
      })
      
      // ✅ TOAST ESPECÍFICO PARA QUOTA EXCEDIDA
      if (errorMessage.includes('Quota') || errorMessage.includes('quota')) {
        toast({
          title: "🚨 Quota do YouTube excedida",
          description: "Aguarde o reset diário ou solicite aumento da quota.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Erro na sincronização",
          description: errorMessage,
          variant: "destructive"
        })
      }
      
      throw error
      
    } finally {
      isProcessingRef.current = false
      setSyncing(false)
      // Limpar progress após 10 segundos
      setTimeout(() => setProgress(null), 10000)
    }
  }, [syncing, performSync, toast])

  const syncAllVideos = async (options: Omit<SyncOptions, 'syncAll' | 'pageToken'>) => {
    setBatchSync({
      isRunning: true,
      canPause: true,
      isPaused: false,
      totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
      allErrors: []
    })

    setSyncing(true)
    let pageToken: string | undefined = undefined
    let currentPage = 1
    let totalPages: number | undefined = undefined
    let totalVideosEstimated: number | undefined = undefined

    try {
      logger.info('Starting complete YouTube sync', { options })

      while (true) {
        // Check if sync was paused
        if (batchSync.isPaused) {
          setProgress({
            step: 'paused',
            current: currentPage,
            total: totalPages || currentPage + 1,
            message: 'Sincronização pausada...',
            currentPage,
            totalPages,
            videosProcessed: batchSync.totalStats.processed,
            totalVideosEstimated
          })
          
          // Wait for resume
          while (batchSync.isPaused) {
            await sleep(1000)
          }
        }

        setProgress({
          step: 'syncing',
          current: currentPage,
          total: totalPages || currentPage + 1,
          message: `Sincronizando página ${currentPage}${totalPages ? ` de ${totalPages}` : ''}...`,
          currentPage,
          totalPages,
          videosProcessed: batchSync.totalStats.processed,
          totalVideosEstimated
        })

        const syncOptions: SyncOptions = {
          ...options,
          syncAll: true,
          pageToken
        }

        const result = await startSync(syncOptions)

        if (!result) break

        // Update total stats
        const newTotalStats = {
          processed: batchSync.totalStats.processed + result.stats.processed,
          new: batchSync.totalStats.new + result.stats.new,
          updated: batchSync.totalStats.updated + result.stats.updated,
          errors: batchSync.totalStats.errors + result.stats.errors,
          totalEstimated: result.stats.totalEstimated
        }

        const newAllErrors = [...batchSync.allErrors, ...(result.errors || [])]

        setBatchSync(prev => ({
          ...prev,
          totalStats: newTotalStats,
          allErrors: newAllErrors,
          pageToken: result.nextPageToken
        }))

        // Update estimates
        if (result.stats.totalEstimated && !totalVideosEstimated) {
          totalVideosEstimated = result.stats.totalEstimated
        }
        if (result.totalPages && !totalPages) {
          totalPages = result.totalPages
        }

        logger.info('Batch sync page completed', {
          currentPage,
          totalPages,
          hasMorePages: result.hasMorePages,
          totalStatsProcessed: newTotalStats.processed,
          totalVideosEstimated
        })

        // Check if there are more pages
        if (!result.hasMorePages || !result.nextPageToken) {
          break
        }

        pageToken = result.nextPageToken
        currentPage++

        // Delay maior entre páginas: 10 minutos
        await sleep(600000)
      }

      // Final success
      setProgress({
        step: 'complete',
        current: totalPages || currentPage,
        total: totalPages || currentPage,
        message: 'Sincronização completa finalizada!',
        currentPage: totalPages || currentPage,
        totalPages: totalPages || currentPage,
        videosProcessed: batchSync.totalStats.processed,
        totalVideosEstimated
      })

      const finalMessage = `Sincronização completa! ${batchSync.totalStats.processed} vídeos processados. ${batchSync.totalStats.new} novos, ${batchSync.totalStats.updated} atualizados.`
      
      toast({
        title: 'Sincronização completa finalizada!',
        description: finalMessage,
      })

      logger.info('Complete sync finished', { 
        totalStats: batchSync.totalStats,
        totalPagesProcessed: currentPage,
        totalErrorsCount: batchSync.allErrors.length
      })

    } catch (error) {
      logger.error('Batch sync error', error)
      
      setProgress({
        step: 'error',
        current: currentPage,
        total: totalPages || currentPage,
        message: 'Erro na sincronização completa',
        errors: [error.message || 'Erro desconhecido'],
        currentPage,
        totalPages,
        videosProcessed: batchSync.totalStats.processed,
        totalVideosEstimated
      })
      
      toast({
        title: 'Erro na sincronização completa',
        description: error.message || 'A sincronização foi interrompida devido a um erro',
        variant: 'destructive'
      })
      
      throw error
    } finally {
      setBatchSync({
        isRunning: false,
        canPause: false,
        isPaused: false,
        totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
        allErrors: []
      })
      setSyncing(false)
      setTimeout(() => setProgress(null), 15000)
    }
  }

  const pauseBatchSync = () => {
    setBatchSync(prev => ({ ...prev, isPaused: true }))
  }

  const resumeBatchSync = () => {
    setBatchSync(prev => ({ ...prev, isPaused: false }))
  }

  const stopBatchSync = () => {
    setBatchSync({
      isRunning: false,
      canPause: false,
      isPaused: false,
      totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
      allErrors: []
    })
    setSyncing(false)
    setProgress(null)
  }
  
  const cancelSync = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    isProcessingRef.current = false
    setSyncing(false)
    setProgress(null)
    setError(null)
    
    toast({
      title: "Sincronização cancelada",
      description: "A sincronização foi cancelada pelo usuário.",
      variant: "default"
    })
  }, [toast])
  
  const getRateLimitStatus = useCallback(() => {
    return {
      canMakeRequest: rateLimiter.canMakeRequest(),
      remainingTime: rateLimiter.getRemainingTime(),
      remainingRequests: rateLimiter.getRemainingRequests()
    }
  }, [])

  const resetProgress = () => {
    setProgress(null)
  }

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
  return {
    // Estados
    syncing,
    progress,
    error,
    batchSync,
    
    // Funções principais
    syncWithYouTube: startSync,
    syncAllVideos,
    pauseBatchSync,
    resumeBatchSync,
    stopBatchSync,
    resetProgress,
    
    // ✅ FUNÇÕES PRINCIPAIS E NOVAS
    startSync,
    cancelSync,
    getRateLimitStatus,
    checkQuotaStatus, // ✅ Nova função para verificar quota
    
    // Utilitários
    clearError: () => setError(null),
    clearProgress: () => setProgress(null)
  }
}
