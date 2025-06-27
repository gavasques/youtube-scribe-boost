import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/core/Logger'
import { useYouTubeSyncCore } from './useYouTubeSyncCore'
import { useBatchSync } from './useBatchSync'
import { useYouTubeQuota } from './useYouTubeQuota'
import { getRateLimitStatus } from './useRateLimiter'
import type { SyncOptions, SyncProgress } from './types'

export const useYouTubeSync = () => {
  const { toast } = useToast()
  const { performSync, cancelSync } = useYouTubeSyncCore()
  const { checkQuotaStatus } = useYouTubeQuota()
  const { batchSync, startBatchSync, pauseBatchSync, resumeBatchSync, stopBatchSync, updateBatchStats } = useBatchSync()
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<SyncProgress>({
    step: '',
    current: 0,
    total: 0,
    message: ''
  })

  const syncWithYouTube = useCallback(async (options: Omit<SyncOptions, 'syncAll' | 'pageToken'>) => {
    setSyncing(true)
    setProgress({ step: 'init', current: 0, total: 0, message: 'Iniciando sincronização...' })

    try {
      const result = await performSync(
        { ...options, syncAll: false },
        (progressUpdate: SyncProgress) => {
          setProgress(progressUpdate)
        }
      )

      toast({
        title: "Sincronização Completa",
        description: `Sincronização concluída com sucesso! Novos: ${result.stats.new}, Atualizados: ${result.stats.updated}, Processados: ${result.stats.processed}, Erros: ${result.stats.errors}`,
      })

      return result

    } catch (error: any) {
      logger.error('Erro durante a sincronização:', error)
      toast({
        title: "Erro na Sincronização",
        description: error.message || 'Ocorreu um erro durante a sincronização.',
        variant: "destructive",
      })
      throw error
    } finally {
      setSyncing(false)
    }
  }, [performSync, toast])

  const syncAllVideos = useCallback(async (options: Omit<SyncOptions, 'syncAll' | 'pageToken'>) => {
    startBatchSync(options)
    setSyncing(true)

    let pageToken: string | undefined = undefined
    let totalProcessed = 0
    let totalNew = 0
    let totalUpdated = 0
    let totalErrors = 0
    let allErrors: string[] = []
    let totalEstimated = 0

    try {
      do {
        logger.info(`[BATCH-SYNC] Iniciando página com token: ${pageToken || 'primeira página'}`)

        if (batchSync.isPaused) {
          logger.info('[BATCH-SYNC] Sincronização pausada. Aguardando...')
          setProgress(prev => ({ ...prev, message: 'Sincronização pausada. Retomando em breve...' }))

          // Aguardar até que isPaused seja false
          await new Promise<void>(resolve => {
            const checkPaused = () => {
              if (!batchSync.isPaused) {
                logger.info('[BATCH-SYNC] Sincronização retomada.')
                resolve()
              } else {
                setTimeout(checkPaused, 5000) // Verificar a cada 5 segundos
              }
            }
            checkPaused()
          })
        }

        const syncResult = await performSync(
          { ...options, syncAll: true, pageToken },
          (progressUpdate: SyncProgress) => {
            setProgress(progressUpdate)
            totalEstimated = progressUpdate.totalVideosEstimated || 0
          }
        )

        pageToken = syncResult.nextPageToken
        totalProcessed += syncResult.stats.processed
        totalNew += syncResult.stats.new
        totalUpdated += syncResult.stats.updated
        totalErrors += syncResult.stats.errors
        allErrors = [...allErrors, ...(syncResult.errors || [])]

        updateBatchStats(
          {
            processed: syncResult.stats.processed,
            new: syncResult.stats.new,
            updated: syncResult.stats.updated,
            errors: syncResult.stats.errors,
            totalEstimated
          },
          syncResult.errors
        )

        logger.info(`[BATCH-SYNC] Página concluída. Processados: ${syncResult.stats.processed}, Novos: ${syncResult.stats.new}, Atualizados: ${syncResult.stats.updated}, Erros: ${syncResult.stats.errors}. Próxima página? ${!!pageToken}`)

      } while (pageToken && batchSync.isRunning)

      logger.info('[BATCH-SYNC] Sincronização completa!')
      toast({
        title: "Sincronização Completa",
        description: `Todos os vídeos sincronizados! Novos: ${totalNew}, Atualizados: ${totalUpdated}, Processados: ${totalProcessed}, Erros: ${totalErrors}`,
      })

    } catch (error: any) {
      logger.error('[BATCH-SYNC] Erro fatal durante a sincronização em lote:', error)
      toast({
        title: "Erro na Sincronização",
        description: error.message || 'Ocorreu um erro durante a sincronização em lote.',
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
      stopBatchSync()
      logger.info('[BATCH-SYNC] Limpando estado e finalizando sincronização.')
    }
  }, [performSync, toast, startBatchSync, batchSync.isPaused, stopBatchSync, updateBatchStats])

  useEffect(() => {
    if (!syncing) return
    
    // CORREÇÃO: Usar getRateLimitStatus corretamente
    const rateLimit = getRateLimitStatus()
    
    logger.info('[YT-SYNC] Verificando limites durante sincronização:', {
      canMakeRequest: rateLimit.canMakeRequest,
      remainingRequests: rateLimit.remainingRequests,
      remainingTime: rateLimit.remainingTime
    })

    if (!rateLimit.canMakeRequest) {
      const waitMinutes = Math.ceil(rateLimit.remainingTime / 60000)
      toast({
        title: "Rate Limit Atingido",
        description: `Aguarde ${waitMinutes} minutos para continuar a sincronização. (${rateLimit.remainingRequests} requests restantes)`,
      })
      cancelSync()
      setSyncing(false)
      return
    }

    checkQuotaStatus().then(quotaStatus => {
      logger.info('[YT-SYNC] Verificação de quota durante sincronização:', quotaStatus)
      
      // CORREÇÃO: Usar isExceeded em vez de hasQuota negativo
      if (quotaStatus.isExceeded) {
        toast({
          title: "Quota Excedida",
          description: `A quota diária do YouTube API foi excedida (${quotaStatus.quotaUsed}/${quotaStatus.quotaLimit}). A sincronização será interrompida.`,
        })
        cancelSync()
        setSyncing(false)
      } else if (quotaStatus.percentageUsed && quotaStatus.percentageUsed >= 95) {
        // Aviso quando quota está muito alta (>=95%)
        toast({
          title: "Quota Quase Excedida",
          description: `Quota em ${quotaStatus.percentageUsed}% (${quotaStatus.remainingQuota} requests restantes). Use com cuidado.`,
        })
      }
    }).catch(error => {
      logger.error('[YT-SYNC] Erro ao verificar quota:', error)
    })
  }, [syncing, toast, cancelSync, checkQuotaStatus])

  return {
    syncing,
    progress,
    syncWithYouTube,
    syncAllVideos,
    cancelSync,
    batchSync,
    pauseBatchSync,
    resumeBatchSync,
    stopBatchSync
  }
}
