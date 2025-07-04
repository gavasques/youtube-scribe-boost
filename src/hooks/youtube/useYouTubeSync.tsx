
import { useState, useCallback, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/core/Logger'
import { useYouTubeSyncCore } from './useYouTubeSyncCore'
import { useBatchSync } from './useBatchSync'
import { useYouTubeQuota } from './useYouTubeQuota'
import { getRateLimitStatus } from './useRateLimiter'
import { shouldContinueSync } from './utils/syncUtils'
import type { SyncOptions, SyncProgress } from './types'

export const useYouTubeSync = () => {
  const { toast } = useToast()
  
  // CORREÇÃO: Inicialização mais segura dos hooks
  const [hooksReady, setHooksReady] = useState(false)
  const syncCoreHook = useYouTubeSyncCore()
  const quotaHook = useYouTubeQuota()
  const batchSyncHook = useBatchSync()
  
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<SyncProgress>({
    step: '',
    current: 0,
    total: 0,
    message: ''
  })

  // Use refs for flow control to avoid race conditions
  const syncControlRef = useRef({
    shouldContinue: true,
    isPaused: false,
    isRunning: false
  })

  // CORREÇÃO: Verificar se todos os hooks estão prontos
  useEffect(() => {
    const checkHooksReady = () => {
      const ready = !!(
        syncCoreHook && 
        typeof syncCoreHook.performSync === 'function' &&
        quotaHook && 
        typeof quotaHook.checkQuotaStatus === 'function' &&
        batchSyncHook
      )
      
      if (ready && !hooksReady) {
        logger.info('[YT-SYNC] Todos os hooks estão prontos')
        setHooksReady(true)
      }
    }
    
    checkHooksReady()
  }, [syncCoreHook, quotaHook, batchSyncHook, hooksReady])

  const syncWithYouTube = useCallback(async (options: Omit<SyncOptions, 'syncAll' | 'pageToken'>) => {
    // CORREÇÃO: Verificar se hooks estão prontos antes de executar
    if (!hooksReady) {
      logger.error('[YT-SYNC] Hooks não estão prontos para sincronização')
      toast({
        title: "Sistema não pronto",
        description: "O sistema ainda está carregando. Tente novamente em alguns segundos.",
        variant: "destructive",
      })
      return
    }

    setSyncing(true)
    setProgress({ step: 'init', current: 0, total: 0, message: 'Iniciando sincronização...' })

    try {
      const result = await syncCoreHook.performSync(
        { ...options, syncAll: false, maxVideos: options.maxVideos || 50 },
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
  }, [syncCoreHook, toast, hooksReady])

  const syncAllVideos = useCallback(async (options: Omit<SyncOptions, 'syncAll' | 'pageToken'>) => {
    // CORREÇÃO: Verificação robusta das opções e estado dos hooks
    if (!hooksReady) {
      logger.error('[BATCH-SYNC] Hooks não estão prontos para sincronização em lote')
      toast({
        title: "Sistema não pronto",
        description: "O sistema ainda está carregando. Tente novamente em alguns segundos.",
        variant: "destructive",
      })
      return
    }

    if (!options || typeof options !== 'object') {
      logger.error('[BATCH-SYNC] Opções inválidas fornecidas:', options)
      toast({
        title: "Erro de Configuração",
        description: "Opções de sincronização inválidas.",
        variant: "destructive",
      })
      return
    }

    // Initialize sync control
    syncControlRef.current = {
      shouldContinue: true,
      isPaused: false,
      isRunning: true
    }

    batchSyncHook.startBatchSync(options)
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
    
    logger.info('[BATCH-SYNC] Iniciando sincronização em lote:', {
      deepScan,
      maxEmptyPages,
      options
    })

    try {
      do {
        logger.info(`[BATCH-SYNC] Iniciando página ${pageCount + 1} com token: ${pageToken || 'primeira página'}`)

        // Check for pause with safer control
        while (batchSyncHook.batchSync.isPaused && syncControlRef.current.isRunning) {
          logger.info('[BATCH-SYNC] Sincronização pausada. Aguardando...')
          setProgress(prev => ({ ...prev, message: 'Sincronização pausada. Retomando em breve...' }))
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Update local control from state
          syncControlRef.current.isPaused = batchSyncHook.batchSync.isPaused
          
          if (!batchSyncHook.batchSync.isRunning) {
            syncControlRef.current.isRunning = false
            syncControlRef.current.shouldContinue = false
            break
          }
        }

        if (!syncControlRef.current.shouldContinue || !syncControlRef.current.isRunning) {
          logger.info('[BATCH-SYNC] Parando sincronização - controle local')
          break
        }

        logger.info(`[BATCH-SYNC] Executando sincronização da página ${pageCount + 1}`)

        const syncResult = await syncCoreHook.performSync(
          { 
            ...options, 
            syncAll: true, 
            pageToken, 
            deepScan, 
            maxEmptyPages,
            maxVideos: options.maxVideos || 50
          },
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

        if (!syncResult) {
          logger.error('[BATCH-SYNC] Resultado de sincronização nulo/indefinido')
          break
        }

        pageToken = syncResult.nextPageToken
        totalProcessed += syncResult.stats.processed
        totalNew += syncResult.stats.new
        totalUpdated += syncResult.stats.updated
        totalErrors += syncResult.stats.errors
        allErrors = [...allErrors, ...(syncResult.errors || [])]
        pageCount++

        // Enhanced page analysis
        const hasNewVideos = syncResult.pageStats?.newInPage > 0
        const pageHasContent = syncResult.pageStats?.videosInPage > 0
        
        if (hasNewVideos) {
          consecutiveEmptyPages = 0
          logger.info(`[BATCH-SYNC] Página ${pageCount} trouxe ${syncResult.pageStats.newInPage} vídeos novos de ${syncResult.pageStats.videosInPage} total. Continuando...`)
        } else {
          consecutiveEmptyPages++
          logger.info(`[BATCH-SYNC] Página ${pageCount} sem vídeos novos (${consecutiveEmptyPages}/${maxEmptyPages}). ${syncResult.pageStats?.updatedInPage || 0} atualizados de ${syncResult.pageStats?.videosInPage || 0} total.`)
        }

        batchSyncHook.updateBatchStats(
          {
            processed: syncResult.stats.processed,
            new: syncResult.stats.new,
            updated: syncResult.stats.updated,
            errors: syncResult.stats.errors,
            totalEstimated: syncResult.pageStats?.totalChannelVideos || totalEstimated
          },
          syncResult.errors,
          syncResult.pageStats
        )

        logger.info(`[BATCH-SYNC] Página ${pageCount} concluída. Processados: ${syncResult.stats.processed}, Novos: ${syncResult.stats.new}, Atualizados: ${syncResult.stats.updated}, Erros: ${syncResult.stats.errors}`)

        // Use utility function for continuation logic
        syncControlRef.current.shouldContinue = shouldContinueSync(
          deepScan, 
          !!pageToken, 
          batchSyncHook.batchSync.isRunning, 
          consecutiveEmptyPages, 
          maxEmptyPages
        ) && pageHasContent

        if (!syncControlRef.current.shouldContinue) {
          if (!pageToken) {
            logger.info('[BATCH-SYNC] Não há mais páginas para processar.')
          } else if (!deepScan && consecutiveEmptyPages >= maxEmptyPages) {
            logger.info(`[BATCH-SYNC] Parando após ${consecutiveEmptyPages} páginas consecutivas sem vídeos novos.`)
          } else if (!pageHasContent) {
            logger.info('[BATCH-SYNC] Parando - página sem conteúdo encontrada.')
          } else if (!batchSyncHook.batchSync.isRunning) {
            logger.info('[BATCH-SYNC] Sincronização interrompida pelo usuário.')
          }
          break
        }

        // Adaptive delay based on processing speed
        if (pageToken && syncControlRef.current.shouldContinue) {
          const delay = (syncResult.processingSpeed?.videosPerMinute || 0) > 30 ? 1000 : 2000
          logger.info(`[BATCH-SYNC] Aguardando ${delay}ms antes da próxima página...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

      } while (pageToken && syncControlRef.current.shouldContinue && syncControlRef.current.isRunning)

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
      logger.error('[YT-SYNC] Error Details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause
      })
      
      toast({
        title: "Erro na Sincronização",
        description: error.message || 'Ocorreu um erro durante a sincronização em lote.',
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
      batchSyncHook.stopBatchSync()
      syncControlRef.current = {
        shouldContinue: false,
        isPaused: false,
        isRunning: false
      }
      logger.info('[BATCH-SYNC] Limpando estado e finalizando sincronização.')
    }
  }, [syncCoreHook, toast, batchSyncHook, hooksReady])

  useEffect(() => {
    if (!syncing || !hooksReady) return
    
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
      syncCoreHook.cancelSync()
      setSyncing(false)
      return
    }

    // CORREÇÃO: Verificação de quota mais segura
    if (quotaHook && typeof quotaHook.checkQuotaStatus === 'function') {
      quotaHook.checkQuotaStatus().then(quotaStatus => {
        logger.info('[YT-SYNC] Verificação de quota durante sincronização:', quotaStatus)
        
        if (quotaStatus.isExceeded) {
          toast({
            title: "Quota Excedida",
            description: `A quota diária do YouTube API foi excedida (${quotaStatus.quotaUsed}/${quotaStatus.quotaLimit}). A sincronização será interrompida.`,
          })
          syncCoreHook.cancelSync()
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
    }
  }, [syncing, toast, syncCoreHook, quotaHook, hooksReady])

  return {
    syncing,
    progress,
    syncWithYouTube,
    syncAllVideos,
    cancelSync: syncCoreHook?.cancelSync || (() => {}),
    batchSync: batchSyncHook.batchSync,
    pauseBatchSync: batchSyncHook.pauseBatchSync,
    resumeBatchSync: batchSyncHook.resumeBatchSync,
    stopBatchSync: batchSyncHook.stopBatchSync
  }
}
