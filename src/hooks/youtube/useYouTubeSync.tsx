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
  const { batchSync, startBatchSync, pauseBatchSync, resumeBatchSync, stopBatchSync, updateBatchStats, shouldContinueSync } = useBatchSync()
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
    let consecutiveEmptyPages = 0
    const maxEmptyPages = options.maxEmptyPages || 5
    let pageCount = 0
    const deepScan = options.deepScan || false
    
    // CORREÇÃO: Variável para controlar a continuação sem depender do estado reativo
    let shouldContinue = true

    logger.info('[BATCH-SYNC] Iniciando sincronização em lote:', {
      deepScan,
      maxEmptyPages,
      options
    })

    try {
      do {
        logger.info(`[BATCH-SYNC] Iniciando página ${pageCount + 1} com token: ${pageToken || 'primeira página'}`)

        // CORREÇÃO: Verificar pausa usando uma função de polling mais eficiente
        while (batchSync.isPaused && shouldContinue) {
          logger.info('[BATCH-SYNC] Sincronização pausada. Aguardando...')
          setProgress(prev => ({ ...prev, message: 'Sincronização pausada. Retomando em breve...' }))
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Verificar se foi cancelada durante a pausa
          if (!batchSync.isRunning) {
            shouldContinue = false
            break
          }
        }

        if (!shouldContinue) break

        const syncResult = await performSync(
          { ...options, syncAll: true, pageToken, deepScan, maxEmptyPages },
          (progressUpdate: SyncProgress) => {
            // Enhanced progress message with detailed stats
            const pageInfo = progressUpdate.pageStats ? 
              ` | Página: ${progressUpdate.pageStats.videosInPage} vídeos, ${progressUpdate.pageStats.newInPage} novos, ${progressUpdate.pageStats.updatedInPage} atualizados` : ''
            
            const speedInfo = progressUpdate.processingSpeed ? 
              ` | Velocidade: ${progressUpdate.processingSpeed.videosPerMinute.toFixed(1)} vídeos/min` : ''
            
            const etaInfo = progressUpdate.processingSpeed?.eta ? 
              ` | ETA: ${new Date(progressUpdate.processingSpeed.eta).toLocaleTimeString('pt-BR')}` : ''

            const deepScanInfo = deepScan ? ' | VARREDURA PROFUNDA' : ''

            setProgress({
              ...progressUpdate,
              message: `${progressUpdate.message} (Página ${pageCount + 1}${consecutiveEmptyPages > 0 ? `, ${consecutiveEmptyPages} páginas sem novos` : ''})${pageInfo}${speedInfo}${etaInfo}${deepScanInfo}`
            })
            totalEstimated = progressUpdate.totalVideosEstimated || syncResult?.pageStats?.totalChannelVideos || 0
          }
        )

        pageToken = syncResult.nextPageToken
        totalProcessed += syncResult.stats.processed
        totalNew += syncResult.stats.new
        totalUpdated += syncResult.stats.updated
        totalErrors += syncResult.stats.errors
        allErrors = [...allErrors, ...(syncResult.errors || [])]
        pageCount++

        // Enhanced page analysis
        const hasNewVideos = syncResult.pageStats.newInPage > 0
        const pageHasContent = syncResult.pageStats.videosInPage > 0
        
        if (hasNewVideos) {
          consecutiveEmptyPages = 0
          logger.info(`[BATCH-SYNC] Página ${pageCount} trouxe ${syncResult.pageStats.newInPage} vídeos novos de ${syncResult.pageStats.videosInPage} total. Continuando...`)
        } else {
          consecutiveEmptyPages++
          logger.info(`[BATCH-SYNC] Página ${pageCount} sem vídeos novos (${consecutiveEmptyPages}/${maxEmptyPages}). ${syncResult.pageStats.updatedInPage} atualizados de ${syncResult.pageStats.videosInPage} total.`)
        }

        updateBatchStats(
          {
            processed: syncResult.stats.processed,
            new: syncResult.stats.new,
            updated: syncResult.stats.updated,
            errors: syncResult.stats.errors,
            totalEstimated: syncResult.pageStats.totalChannelVideos || totalEstimated
          },
          syncResult.errors,
          syncResult.pageStats
        )

        logger.info(`[BATCH-SYNC] Página ${pageCount} concluída. Processados: ${syncResult.stats.processed}, Novos: ${syncResult.stats.new}, Atualizados: ${syncResult.stats.updated}, Erros: ${syncResult.stats.errors}`)

        // CORREÇÃO: Lógica de continuação corrigida
        shouldContinue = shouldContinueSync(deepScan, !!pageToken) && 
                         batchSync.isRunning && 
                         pageHasContent // Stop if page has no content at all

        if (!shouldContinue) {
          if (!pageToken) {
            logger.info('[BATCH-SYNC] Não há mais páginas para processar.')
          } else if (!deepScan && consecutiveEmptyPages >= maxEmptyPages) {
            logger.info(`[BATCH-SYNC] Parando após ${consecutiveEmptyPages} páginas consecutivas sem vídeos novos.`)
          } else if (!pageHasContent) {
            logger.info('[BATCH-SYNC] Parando - página sem conteúdo encontrada.')
          } else if (!batchSync.isRunning) {
            logger.info('[BATCH-SYNC] Sincronização interrompida pelo usuário.')
          }
          break
        }

        // Adaptive delay based on processing speed
        if (pageToken && shouldContinue) {
          const delay = syncResult.processingSpeed.videosPerMinute > 30 ? 1000 : 2000
          logger.info(`[BATCH-SYNC] Aguardando ${delay}ms antes da próxima página...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

      } while (pageToken && shouldContinue)

      logger.info('[BATCH-SYNC] Sincronização completa!', {
        totalPages: pageCount,
        totalNew,
        totalUpdated,
        totalProcessed,
        totalErrors,
        consecutiveEmptyPages,
        deepScan,
        totalEstimated
      })

      const message = deepScan 
        ? `Varredura profunda completa! ${totalProcessed} vídeos processados (${totalNew} novos, ${totalUpdated} atualizados) em ${pageCount} páginas de ~${totalEstimated} vídeos do canal.`
        : totalNew > 0 
          ? `Sincronização completa! ${totalNew} vídeos novos, ${totalUpdated} atualizados em ${pageCount} páginas de ~${totalEstimated} vídeos do canal.`
          : `Sincronização completa! ${totalUpdated} vídeos atualizados, nenhum vídeo novo encontrado em ${pageCount} páginas processadas.`

      toast({
        title: deepScan ? "Varredura Profunda Completa" : "Sincronização Completa",
        description: message,
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
  }, [performSync, toast, startBatchSync, batchSync.isPaused, batchSync.isRunning, stopBatchSync, updateBatchStats, shouldContinueSync])

  useEffect(() => {
    if (!syncing) return
    
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
      
      if (quotaStatus.isExceeded) {
        toast({
          title: "Quota Excedida",
          description: `A quota diária do YouTube API foi excedida (${quotaStatus.quotaUsed}/${quotaStatus.quotaLimit}). A sincronização será interrompida.`,
        })
        cancelSync()
        setSyncing(false)
      } else if (quotaStatus.percentageUsed && quotaStatus.percentageUsed >= 95) {
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
