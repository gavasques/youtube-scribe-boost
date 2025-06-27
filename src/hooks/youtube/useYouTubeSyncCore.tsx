
import { useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/core/Logger'
import { rateLimiter, getRateLimitStatus } from './useRateLimiter'
import { useYouTubeQuota } from './useYouTubeQuota'
import type { SyncOptions, SyncResult, SyncProgress } from './types'

// Cache for avoiding duplicate requests
const syncCache = new Map<string, { result: any; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// Sleep utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const useYouTubeSyncCore = () => {
  const { checkQuotaStatus } = useYouTubeQuota()
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastRequestTimeRef = useRef<number>(0)

  const performSync = async (
    options: SyncOptions,
    setProgress: (progress: SyncProgress) => void
  ): Promise<SyncResult> => {
    logger.info('[YT-SYNC] Iniciando sincronização', { options })
    
    // 1. Verificação detalhada da quota
    setProgress({
      step: 'quota_check',
      current: 0,
      total: 6,
      message: 'Verificando quota do YouTube API...'
    })
    
    const quotaStatus = await checkQuotaStatus()
    logger.info('[YT-SYNC] Status da quota:', quotaStatus)
    
    // CORREÇÃO: Detecção mais precisa de quota excedida
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
    
    // CORREÇÃO: Validação mais precisa da quota disponível
    if (quotaStatus.quotaUsed >= quotaStatus.quotaLimit) {
      const resetTime = quotaStatus.resetTime ? 
        new Date(quotaStatus.resetTime).toLocaleString('pt-BR') : 
        'desconhecido'
      
      throw new Error(`Quota do YouTube API excedida (${quotaStatus.quotaUsed}/${quotaStatus.quotaLimit}). Reset em: ${resetTime}`)
    }
    
    // CORREÇÃO: Aviso preventivo apenas quando quota realmente está alta (>=80%)
    if (quotaStatus.percentageUsed && quotaStatus.percentageUsed >= 80) {
      logger.warn(`[YT-SYNC] ⚠️ Quota alta: ${quotaStatus.percentageUsed}% usada`)
      
      setProgress({
        step: 'quota_warning',
        current: 0,
        total: 6,
        message: `⚠️ Quota em ${quotaStatus.percentageUsed}% - Use com moderação (${quotaStatus.remainingQuota} requests restantes)`
      })
      
      await sleep(2000) // Reduzido de 3s para 2s
    } else {
      logger.info(`[YT-SYNC] ✅ Quota OK: ${quotaStatus.percentageUsed}% usada (${quotaStatus.remainingQuota} requests restantes)`)
      
      setProgress({
        step: 'quota_ok',
        current: 0,
        total: 6,
        message: `✅ Quota disponível: ${quotaStatus.remainingQuota} requests restantes`
      })
    }
    
    // 2. Verificar rate limiting
    setProgress({
      step: 'rate_check',
      current: 1,
      total: 6,
      message: 'Verificando rate limiting...'
    })
    
    // CORREÇÃO: Usar getRateLimitStatus em vez de rateLimiter diretamente
    const rateLimitStatus = getRateLimitStatus()
    logger.info('[YT-SYNC] Status do rate limit:', rateLimitStatus)
    
    if (!rateLimitStatus.canMakeRequest) {
      const remainingTime = rateLimitStatus.remainingTime
      const waitMinutes = Math.ceil(remainingTime / 60000)
      throw new Error(`Rate limit atingido. Aguarde ${waitMinutes} minutos. (${rateLimitStatus.remainingRequests} requests restantes)`)
    }

    // 3. Verificar cache
    const cacheKey = JSON.stringify(options)
    const cached = syncCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.info('[YT-SYNC] Usando cache', { cacheKey })
      return cached.result
    }

    // 4. CORREÇÃO: Intervalo mínimo reduzido de 2 minutos para 30 segundos
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTimeRef.current
    const minInterval = 30000 // 30 segundos mínimo (era 120000)

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

    // 6. Executar sync com detecção melhorada
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
              quotaCheck: quotaStatus
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

          // Verificar erro na response
          if (response.error) {
            const errorMsg = response.error.message || 'Erro desconhecido'
            
            // Detecção específica de quota excedida na resposta
            if (errorMsg.includes('quotaExceeded') || 
                errorMsg.includes('Daily Limit Exceeded') ||
                errorMsg.includes('quota') || 
                errorMsg.includes('Quota') ||
                errorMsg.includes('403')) {
              
              logger.error('[YT-SYNC] 🚨 Quota excedida detectada na resposta da API')
              throw new Error('🚨 Quota do YouTube API excedida. Aguarde o reset diário (00:00 UTC) ou solicite aumento da quota no Google Cloud Console.')
            }
            
            if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
              throw new Error(`Rate limit do YouTube: ${errorMsg}`)
            }
            
            throw new Error(errorMsg)
          }

          const result = response.data as SyncResult

          // Validação crítica
          if (!result || !result.stats) {
            throw new Error('Resposta inválida da Edge Function - sem stats')
          }

          setProgress({
            step: 'validating',
            current: 5,
            total: 6,
            message: 'Validando resultados...'
          })

          // Detecção de falso sucesso
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
            
            if (!result.errors || result.errors.length === 0) {
              throw new Error(
                '🚨 Sincronização retornou sucesso mas não processou nenhum vídeo. ' +
                'Possível problema de quota, autenticação ou rate limiting no YouTube. ' +
                'Verifique se a quota não foi excedida.'
              )
            }
            
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
            syncCache.set(cacheKey, {
              result,
              timestamp: Date.now()
            })
          }

          // Limpar cache antigo
          for (const [key, value] of syncCache.entries()) {
            if (Date.now() - value.timestamp > CACHE_TTL) {
              syncCache.delete(key)
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

        // Detecção específica de quota excedida
        if (error.message?.includes('quotaExceeded') || 
            error.message?.includes('Daily Limit Exceeded') ||
            error.message?.includes('quota') || 
            error.message?.includes('Quota') ||
            error.message?.includes('403')) {
          
          logger.error('[YT-SYNC] 🚨 Quota excedida detectada, não tentando novamente')
          throw new Error('🚨 Quota do YouTube API excedida. Aguarde o reset diário (00:00 UTC) ou solicite aumento da quota no Google Cloud Console.')
        }

        // Se é erro 429, aguardar muito mais tempo
        if (error.message?.includes('429') || 
            error.message?.includes('Too Many Requests') ||
            error.message?.includes('rate limit')) {
          
          if (attempt < 3) {
            const delays = [180000, 360000, 720000] // 3min, 6min, 12min (era 10min, 20min, 40min)
            const delay = delays[attempt - 1]
            
            logger.info(`[YT-SYNC] Rate limit detectado. Aguardando ${delay / 60000}s`)
            
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

        // Para outros erros, aguardar tempo reduzido
        if (attempt < 3) {
          const delay = 30000 * attempt // 30s, 60s (era 60s, 120s)
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
  }

  const cancelSync = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  return {
    performSync,
    cancelSync
  }
}
