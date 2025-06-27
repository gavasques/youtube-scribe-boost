
import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useRateLimiter } from '@/hooks/useRateLimiter'
import { useDebounce } from '@/hooks/useDebounce'
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

// Cache para evitar requisições duplicadas
const syncCache = new Map<string, { result: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

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
  
  // Rate limiting MUITO mais conservador
  const youtubeRateLimiter = useRateLimiter({
    maxRequests: 1,        // ✅ APENAS 1 request
    windowMs: 300000,      // ✅ A cada 5 minutos
    key: 'youtube_sync'
  })
  
  // Controle de requisições ativas
  const activeRequestRef = useRef<AbortController | null>(null)
  const lastRequestTimeRef = useRef<number>(0)
  
  // Função principal de sync com todas as melhorias
  const syncWithYouTube = useCallback(async (options: SyncOptions): Promise<SyncResult> => {
    // 1. Verificar rate limiting ANTES de qualquer coisa
    if (youtubeRateLimiter.checkRateLimit()) {
      const remainingTime = youtubeRateLimiter.getRemainingTime()
      const waitMinutes = Math.ceil(remainingTime / 60000)
      
      throw new Error(`Rate limit atingido. Aguarde ${waitMinutes} minutos antes de tentar novamente.`)
    }
    
    // 2. Verificar se há requisição ativa
    if (activeRequestRef.current) {
      activeRequestRef.current.abort()
    }
    
    // 3. Criar novo AbortController
    activeRequestRef.current = new AbortController()
    
    // 4. Verificar cache
    const cacheKey = JSON.stringify(options)
    const cached = syncCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.info('Usando resultado do cache para sync', { cacheKey })
      return cached.result
    }
    
    // 5. Garantir intervalo mínimo entre requests
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTimeRef.current
    const minInterval = 60000 // 1 minuto mínimo
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest
      logger.info(`Aguardando ${waitTime}ms antes da próxima requisição`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    lastRequestTimeRef.current = Date.now()
    
    // 6. Executar sync com retry robusto
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        logger.info(`[YT-SYNC] Tentativa ${attempt}/3`, { options })
        
        setProgress({
          step: 'connecting',
          current: 0,
          total: 3,
          message: `Conectando ao YouTube (tentativa ${attempt}/3)...`
        })
        
        // Verificar autenticação
        const { data: authData } = await supabase.auth.getSession()
        if (!authData.session) {
          throw new Error('Usuário não autenticado')
        }
        
        setProgress({
          step: 'syncing',
          current: 1,
          total: 3,
          message: 'Sincronizando vídeos...'
        })
        
        // Chamar Edge Function com timeout
        const response = await Promise.race([
          supabase.functions.invoke('youtube-sync', {
            body: { options },
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.session.access_token}`
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout na requisição')), 120000) // 2 minutos timeout
          )
        ]) as any
        
        if (response.error) {
          throw new Error(response.error.message || 'Erro na sincronização')
        }
        
        const result = response.data as SyncResult
        
        // Incrementar rate limiter
        youtubeRateLimiter.incrementCount()
        
        // Salvar no cache
        syncCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        })
        
        // Limpar cache antigo
        for (const [key, value] of syncCache.entries()) {
          if (Date.now() - value.timestamp > CACHE_TTL) {
            syncCache.delete(key)
          }
        }
        
        logger.info('[YT-SYNC] Sincronização concluída com sucesso', { result })
        return result
        
      } catch (error: any) {
        lastError = error
        logger.error(`[YT-SYNC] Tentativa ${attempt} falhou`, { error: error.message })
        
        // Se é erro 429, aguardar muito mais tempo
        if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
          if (attempt < 3) {
            // Delays progressivos para erro 429: 2min, 5min, 10min
            const delays = [120000, 300000, 600000] // 2min, 5min, 10min
            const delay = delays[attempt - 1]
            
            logger.info(`[YT-SYNC] Erro 429 detectado. Aguardando ${delay / 1000}s antes da próxima tentativa...`)
            
            setProgress({
              step: 'waiting',
              current: attempt,
              total: 3,
              message: `Rate limit atingido. Aguardando ${Math.ceil(delay / 60000)} minutos...`
            })
            
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
        }
        
        // Para outros erros, aguardar menos tempo
        if (attempt < 3) {
          const normalDelay = 30000 * attempt // 30s, 60s
          logger.info(`[YT-SYNC] Aguardando ${normalDelay / 1000}s antes da próxima tentativa...`)
          
          setProgress({
            step: 'retrying',
            current: attempt,
            total: 3,
            message: `Erro encontrado. Tentando novamente em ${normalDelay / 1000}s...`
          })
          
          await new Promise(resolve => setTimeout(resolve, normalDelay))
        }
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    throw lastError || new Error('Falha após 3 tentativas')
    
  }, [youtubeRateLimiter])
  
  // Função com debounce para evitar múltiplas chamadas
  const debouncedSync = useDebounce(syncWithYouTube, 3000) // 3 segundos de debounce
  
  // Função pública que gerencia estados
  const startSync = useCallback(async (options: SyncOptions) => {
    // Verificar se já está sincronizando
    if (syncing) {
      toast({
        title: "Sincronização em andamento",
        description: "Aguarde a sincronização atual terminar.",
        variant: "default"
      })
      return
    }
    
    // Verificar rate limiting e mostrar feedback
    if (youtubeRateLimiter.checkRateLimit()) {
      const remainingTime = youtubeRateLimiter.getRemainingTime()
      const waitMinutes = Math.ceil(remainingTime / 60000)
      
      setError(`Rate limit atingido. Aguarde ${waitMinutes} minutos.`)
      toast({
        title: "Rate limit atingido",
        description: `Aguarde ${waitMinutes} minutos antes de tentar novamente.`,
        variant: "destructive"
      })
      return
    }
    
    try {
      setSyncing(true)
      setError(null)
      setProgress({
        step: 'starting',
        current: 0,
        total: 3,
        message: 'Iniciando sincronização...'
      })
      
      const result = await debouncedSync(options)
      
      setProgress({
        step: 'completed',
        current: 3,
        total: 3,
        message: 'Sincronização concluída com sucesso!'
      })
      
      toast({
        title: "Sincronização concluída",
        description: `${result.stats.processed} vídeos processados. ${result.stats.new} novos, ${result.stats.updated} atualizados.`,
        variant: "default"
      })
      
      return result
      
    } catch (error: any) {
      logger.error('[YT-SYNC] Erro na sincronização', { error: error.message })
      
      const errorMessage = error.message || 'Erro desconhecido na sincronização'
      setError(errorMessage)
      
      setProgress({
        step: 'error',
        current: 0,
        total: 3,
        message: `Erro: ${errorMessage}`
      })
      
      toast({
        title: "Erro na sincronização",
        description: errorMessage,
        variant: "destructive"
      })
      
      throw error
      
    } finally {
      setSyncing(false)
      // Limpar progress após 5 segundos
      setTimeout(() => setProgress(null), 5000)
    }
  }, [syncing, youtubeRateLimiter, debouncedSync, toast])

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
            await new Promise(resolve => setTimeout(resolve, 1000))
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

        // Add delay between requests to avoid rate limiting - AUMENTADO
        await new Promise(resolve => setTimeout(resolve, 300000)) // 5 minutos entre páginas
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
  
  // Função para cancelar sync
  const cancelSync = useCallback(() => {
    if (activeRequestRef.current) {
      activeRequestRef.current.abort()
      activeRequestRef.current = null
    }
    setSyncing(false)
    setProgress(null)
    setError(null)
    
    toast({
      title: "Sincronização cancelada",
      description: "A sincronização foi cancelada pelo usuário.",
      variant: "default"
    })
  }, [toast])
  
  // Função para verificar status do rate limit
  const getRateLimitStatus = useCallback(() => {
    return {
      canMakeRequest: !youtubeRateLimiter.checkRateLimit(),
      remainingTime: youtubeRateLimiter.getRemainingTime(),
      remainingRequests: youtubeRateLimiter.getRemainingRequests()
    }
  }, [youtubeRateLimiter])

  const resetProgress = () => {
    setProgress(null)
  }
  
  return {
    // Estados
    syncing,
    progress,
    error,
    batchSync,
    
    // Funções principais (mantendo compatibilidade)
    syncWithYouTube: startSync,
    syncAllVideos,
    pauseBatchSync,
    resumeBatchSync,
    stopBatchSync,
    resetProgress,
    
    // Novas funções
    startSync,
    cancelSync,
    getRateLimitStatus,
    
    // Utilitários
    clearError: () => setError(null),
    clearProgress: () => setProgress(null)
  }
}
