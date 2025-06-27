import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useRetry } from '@/hooks/useRetry'
import { useRateLimiter } from '@/hooks/useRateLimiter'
import { useDebounce } from '@/hooks/useDebounce'
import { showErrorToast, showSuccessToast, showWarningToast } from '@/components/ui/enhanced-toast'
import { logger } from '@/core/Logger'

interface SyncOptions {
  type: 'full' | 'incremental'
  includeRegular: boolean
  includeShorts: boolean
  syncMetadata: boolean
  maxVideos: number
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
  exceeded: boolean
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

export function useYouTubeSync() {
  const { toast } = useToast()
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [batchSync, setBatchSync] = useState<BatchSyncState>({
    isRunning: false,
    canPause: false,
    isPaused: false,
    totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
    allErrors: []
  })

  // Rate limiting configuration
  const youtubeRateLimiter = useRateLimiter({
    maxRequests: 3,
    windowMs: 120000, // 2 minutes
    key: 'youtube_sync'
  })

  // Enhanced retry configuration with exponential backoff
  const { retryWithCondition } = useRetry({
    maxAttempts: 3,
    delay: 5000, // Start with 5s
    backoff: true
  })

  // Debounced sync function to prevent rapid successive calls
  const [syncRequest, setSyncRequest] = useState<SyncOptions | null>(null)
  const debouncedSyncRequest = useDebounce(syncRequest, 2000)

  // Enhanced sync function with intelligent rate limiting
  const syncWithYouTube = async (options: SyncOptions): Promise<SyncResult> => {
    setSyncing(true)
    setProgress({ 
      step: 'starting', 
      current: 0, 
      total: 3, 
      message: 'Iniciando sincronização...' 
    })

    try {
      // Check rate limiting first
      if (youtubeRateLimiter.checkRateLimit()) {
        const remainingTime = youtubeRateLimiter.getRemainingTime()
        const remainingRequests = youtubeRateLimiter.getRemainingRequests()
        
        throw new Error(`Rate limit atingido. ${remainingRequests} requisições restantes. Aguarde ${Math.ceil(remainingTime / 1000)} segundos.`)
      }

      logger.info('Starting YouTube sync with rate limiting', { 
        options,
        rateLimitStatus: {
          remaining: youtubeRateLimiter.getRemainingRequests(),
          resetIn: youtubeRateLimiter.getRemainingTime()
        }
      })

      setProgress({ 
        step: 'auth', 
        current: 1, 
        total: 3, 
        message: 'Verificando autenticação...',
        totalVideosEstimated: options.syncAll ? undefined : options.maxVideos
      })

      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('Usuário não autenticado')
      }

      setProgress({ 
        step: 'syncing', 
        current: 2, 
        total: 3, 
        message: options.syncAll ? 'Sincronizando todos os vídeos...' : `Sincronizando até ${options.maxVideos} vídeos...`,
        totalVideosEstimated: options.syncAll ? undefined : options.maxVideos
      })

      const payload = {
        options: {
          type: options.type,
          includeRegular: options.includeRegular,
          includeShorts: options.includeShorts,
          syncMetadata: options.syncMetadata,
          maxVideos: options.maxVideos,
          pageToken: options.pageToken || null,
          syncAll: options.syncAll || false
        }
      }

      console.log('YouTube Sync - Enviando payload:', JSON.stringify(payload, null, 2))
      logger.info('Sending request payload', payload)

      // Increment rate limit counter
      youtubeRateLimiter.incrementCount()

      // Enhanced retry logic with intelligent error handling
      const result = await retryWithCondition(
        async () => {
          console.log('YouTube Sync - Testando comunicação...')
          
          // Test connection first
          const testResponse = await supabase.functions.invoke('youtube-sync', {
            body: JSON.stringify({ test: true })
          })

          console.log('YouTube Sync - Test response:', testResponse)

          if (testResponse.error) {
            console.error('YouTube Sync - Test failed:', testResponse.error)
            throw new Error(`Teste de comunicação falhou: ${testResponse.error.message}`)
          }

          console.log('YouTube Sync - Enviando requisição real...')
          
          // Wait a bit before the real request to avoid overwhelming
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const response = await supabase.functions.invoke('youtube-sync', {
            body: JSON.stringify(payload)
          })

          console.log('YouTube Sync - Raw response:', response)

          if (response.error) {
            console.error('YouTube Sync - Response error:', response.error)
            logger.error('Sync failed', response.error)
            
            const errorMessage = response.error.message || 'Erro desconhecido'
            
            // Enhanced error handling with specific messages
            if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
              throw new Error('Muitas requisições. O sistema está limitando a velocidade para proteger a API. Aguarde alguns minutos antes de tentar novamente.')
            }
            
            if (errorMessage.includes('quota') || errorMessage.includes('exceeded') || 
                errorMessage.includes('quotaExceeded')) {
              throw new Error('YouTube API quota excedida. A quota é resetada à meia-noite (horário do Pacífico). Tente novamente em algumas horas.')
            }
            
            if (errorMessage.includes('Bad Request') || errorMessage.includes('Missing options')) {
              console.error('Payload enviado:', JSON.stringify(payload, null, 2))
              throw new Error('Erro na estrutura da requisição. Verifique os parâmetros de sincronização.')
            }
            
            if (errorMessage.includes('YouTube not connected')) {
              throw new Error('YouTube não conectado. Conecte sua conta do YouTube primeiro.')
            }
            
            throw new Error(`Erro na sincronização: ${errorMessage}`)
          }

          if (!response.data) {
            throw new Error('Nenhum dado retornado pelo servidor')
          }

          console.log('YouTube Sync - Success response:', response.data)
          return response.data as SyncResult
        },
        // Enhanced retry condition with intelligent backoff
        (error, attemptNumber) => {
          const errorMessage = error.message?.toLowerCase() || ''
          
          // Never retry these errors
          if (errorMessage.includes('authentication') || 
              errorMessage.includes('authorization') ||
              errorMessage.includes('não conectado') ||
              errorMessage.includes('bad request') ||
              errorMessage.includes('missing options')) {
            return false
          }
          
          // For rate limiting errors, implement longer delays
          if (errorMessage.includes('429') || 
              errorMessage.includes('too many requests') ||
              errorMessage.includes('muitas requisições')) {
            
            // Exponential backoff for rate limiting: 30s, 60s, 120s
            const rateLimitDelay = 30000 * Math.pow(2, attemptNumber - 1)
            console.log(`Rate limit detected, waiting ${rateLimitDelay / 1000}s before retry ${attemptNumber}`)
            
            // Show user-friendly message
            showWarningToast({
              title: 'Rate Limit Detectado',
              description: `Aguardando ${rateLimitDelay / 1000}s antes da próxima tentativa...`,
              duration: 5000
            })
            
            // Set a longer delay for rate limit errors
            setTimeout(() => {}, rateLimitDelay)
            return true
          }
          
          // For quota errors, don't retry
          if (errorMessage.includes('quota') || 
              errorMessage.includes('exceeded') ||
              errorMessage.includes('quotaexceeded')) {
            return false
          }
          
          console.log('Retry condition check:', { error: errorMessage, attemptNumber, shouldRetry: true })
          return true
        }
      )

      setProgress({ 
        step: 'complete', 
        current: 3, 
        total: 3, 
        message: 'Sincronização concluída!',
        totalVideosEstimated: result.stats.totalEstimated,
        videosProcessed: result.stats.processed,
        quotaInfo: result.quotaInfo
      })

      const statsMessage = `${result.stats.processed} vídeos processados. ${result.stats.new} novos, ${result.stats.updated} atualizados.`
      
      // Show quota info if available
      let quotaMessage = ''
      if (result.quotaInfo) {
        const usagePercentage = ((result.quotaInfo.requestsUsed || 0) / (result.quotaInfo.dailyLimit || 10000)) * 100
        quotaMessage = ` Quota: ${usagePercentage.toFixed(1)}% usada.`
      }
      
      if (result.errors && result.errors.length > 0) {
        showWarningToast({
          title: 'Sincronização concluída com avisos',
          description: `${statsMessage}${quotaMessage} ${result.errors.length} erros encontrados.`
        })
      } else {
        showSuccessToast({
          title: 'Sincronização concluída!',
          description: `${statsMessage}${quotaMessage}`
        })
      }

      logger.info('Sync completed successfully', { stats: result.stats, quotaInfo: result.quotaInfo })

      return result

    } catch (error) {
      logger.error('Sync error', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      // Check if it's a rate limit error
      const isRateLimitError = errorMessage.toLowerCase().includes('rate limit') || 
                               errorMessage.toLowerCase().includes('muitas requisições') ||
                               errorMessage.toLowerCase().includes('429') ||
                               errorMessage.toLowerCase().includes('too many requests')
      
      // Check if it's a quota error
      const isQuotaError = errorMessage.toLowerCase().includes('quota') || 
                          errorMessage.toLowerCase().includes('exceeded') ||
                          errorMessage.toLowerCase().includes('quotaexceeded')
      
      setProgress({ 
        step: 'error', 
        current: 0, 
        total: 3, 
        message: isRateLimitError ? 'Rate limit atingido' : 
                 isQuotaError ? 'Quota do YouTube API excedida' : 'Erro na sincronização',
        errors: [errorMessage],
        quotaInfo: isQuotaError ? { exceeded: true, resetTime: 'Meia-noite (Horário do Pacífico)' } : undefined
      })
      
      // Show appropriate toast based on error type
      if (isRateLimitError) {
        showWarningToast({
          title: 'Rate Limit Atingido',
          description: 'Muitas requisições foram feitas muito rapidamente. Aguarde alguns minutos antes de tentar novamente.',
          duration: 8000
        })
      } else if (isQuotaError) {
        showErrorToast({
          title: 'Quota do YouTube API excedida',
          description: 'Tente novamente após a meia-noite (horário do Pacífico).',
          duration: 8000
        })
      } else {
        showErrorToast({
          title: 'Erro na sincronização',
          description: errorMessage,
          duration: 6000
        })
      }
      
      throw error
    } finally {
      setSyncing(false)
      setTimeout(() => setProgress(null), 15000)
    }
  }

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
          
          while (batchSync.isPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        setProgress({
          step: 'syncing',
          current: currentPage,
          total: totalPages || currentPage + 1,
          message: `Processando página ${currentPage}${totalPages ? ` de ${totalPages}` : ''}...`,
          currentPage,
          totalPages,
          videosProcessed: batchSync.totalStats.processed,
          totalVideosEstimated
        })

        const syncOptions: SyncOptions = {
          ...options,
          syncAll: true,
          pageToken,
          maxVideos: 50
        }

        const result = await syncWithYouTube(syncOptions)

        const newTotalStats = {
          processed: batchSync.totalStats.processed + result.stats.processed,
          new: batchSync.totalStats.new + result.stats.new,
          updated: batchSync.totalStats.updated + result.stats.updated,
          errors: batchSync.totalStats.errors + result.stats.errors,
          totalEstimated: result.stats.totalEstimated || batchSync.totalStats.totalEstimated
        }

        const newAllErrors = [...batchSync.allErrors, ...(result.errors || [])]

        setBatchSync(prev => ({
          ...prev,
          totalStats: newTotalStats,
          allErrors: newAllErrors,
          pageToken: result.nextPageToken
        }))

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
          totalVideosEstimated,
          nextPageToken: result.nextPageToken,
          quotaInfo: result.quotaInfo
        })

        if (!result.hasMorePages || !result.nextPageToken) {
          logger.info('No more pages to process, completing sync')
          break
        }

        pageToken = result.nextPageToken
        currentPage++

        await new Promise(resolve => setTimeout(resolve, 2000))
      }

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
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      const isQuotaError = errorMessage.toLowerCase().includes('quota') || 
                          errorMessage.toLowerCase().includes('exceeded')
      
      setProgress({
        step: 'error',
        current: currentPage,
        total: totalPages || currentPage,
        message: isQuotaError ? 'Quota excedida durante sincronização completa' : 'Erro na sincronização completa',
        errors: [errorMessage],
        currentPage,
        totalPages,
        videosProcessed: batchSync.totalStats.processed,
        totalVideosEstimated,
        quotaInfo: isQuotaError ? { exceeded: true, resetTime: 'Meia-noite (Horário do Pacífico)' } : undefined
      })
      
      toast({
        title: isQuotaError ? 'Quota excedida' : 'Erro na sincronização completa',
        description: isQuotaError ? 
          'Quota do YouTube API excedida durante sincronização. Tente novamente após reset.' :
          errorMessage,
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

  const resetProgress = () => {
    setProgress(null)
  }

  return {
    syncing,
    progress,
    batchSync,
    syncWithYouTube,
    syncAllVideos,
    pauseBatchSync,
    resumeBatchSync,
    stopBatchSync,
    resetProgress,
    rateLimitInfo: {
      isLimited: youtubeRateLimiter.isLimited,
      remainingRequests: youtubeRateLimiter.getRemainingRequests(),
      remainingTime: youtubeRateLimiter.getRemainingTime(),
      currentCount: youtubeRateLimiter.currentCount
    }
  }
}
