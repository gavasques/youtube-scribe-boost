
import { useState, useCallback, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useYouTubeAuth } from '@/hooks/useYouTubeAuth'
import { useSyncState } from './useSyncState'
import { useYouTubeSyncCore } from './useYouTubeSyncCore'

interface SyncOptions {
  type: 'full' | 'incremental'
  includeRegular: boolean
  includeShorts: boolean
  syncMetadata: boolean
  maxVideos: number
  deepScan?: boolean
  maxEmptyPages?: number
}

interface BatchSyncState {
  isRunning: boolean
  canPause: boolean
  isPaused: boolean
  totalStats: { processed: number; new: number; updated: number; errors: number }
  allErrors: string[]
  pagesProcessed: number
  emptyPages: number
  maxEmptyPages: number
  startTime?: number
}

export const useYouTubeSyncManager = () => {
  const { toast } = useToast()
  const { isConnected, tokens, checkConnection } = useYouTubeAuth()
  const { state, progress, setProgress, markReady, markError, markSyncComplete, updateConnectionStatus } = useSyncState()
  const { performSync } = useYouTubeSyncCore()
  
  const [syncing, setSyncing] = useState(false)
  const [batchSync, setBatchSync] = useState<BatchSyncState>({
    isRunning: false,
    canPause: false,
    isPaused: false,
    totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
    allErrors: [],
    pagesProcessed: 0,
    emptyPages: 0,
    maxEmptyPages: 25 // CORREÇÃO: Aumentado de 5 para 25
  })

  const syncControlRef = useRef({
    shouldContinue: true,
    isRunning: false,
    aborted: false
  })

  useEffect(() => {
    const initializeSystem = async () => {
      console.log('[SYNC-MANAGER] Inicializando sistema...')
      
      try {
        await checkConnection()
        
        setTimeout(() => {
          if (isConnected && tokens) {
            console.log('[SYNC-MANAGER] Sistema pronto - YouTube conectado')
            markReady(true)
          } else {
            console.log('[SYNC-MANAGER] Sistema pronto - YouTube desconectado')
            markReady(false)
          }
        }, 500)

      } catch (error) {
        console.error('[SYNC-MANAGER] Erro na inicialização:', error)
        markError('Erro na inicialização do sistema')
      }
    }

    if (!state.isReady && state.isInitializing) {
      initializeSystem()
    }
  }, [isConnected, tokens, checkConnection, markReady, markError, state.isReady, state.isInitializing])

  useEffect(() => {
    updateConnectionStatus(isConnected && !!tokens)
  }, [isConnected, tokens, updateConnectionStatus])

  const syncWithYouTube = useCallback(async (options: SyncOptions) => {
    if (!state.hasYouTubeConnection) {
      toast({
        title: "YouTube não conectado",
        description: "Conecte sua conta do YouTube antes de sincronizar.",
        variant: "destructive",
      })
      return
    }

    console.log('[SYNC-MANAGER] Iniciando sincronização incremental')
    
    syncControlRef.current = {
      shouldContinue: true,
      isRunning: true,
      aborted: false
    }
    
    setSyncing(true)

    setProgress({
      step: 'init',
      current: 0,
      total: 5,
      message: 'Iniciando sincronização incremental...'
    })

    try {
      let totalProcessed = 0
      let totalNew = 0
      let totalUpdated = 0

      const result = await performSync(
        { ...options, syncAll: false },
        (progressUpdate) => {
          if (syncControlRef.current.aborted) {
            throw new Error('Sincronização abortada pelo usuário')
          }

          setProgress({
            ...progressUpdate,
            message: `${progressUpdate.message} | Processados: ${totalProcessed + (progressUpdate.pageStats?.videosInPage || 0)}`,
            pageStats: progressUpdate.pageStats,
            processingSpeed: progressUpdate.processingSpeed,
            totalVideosEstimated: progressUpdate.totalVideosEstimated
          })

          if (progressUpdate.pageStats) {
            totalProcessed += progressUpdate.pageStats.videosInPage
            totalNew += progressUpdate.pageStats.newInPage
            totalUpdated += progressUpdate.pageStats.updatedInPage
          }
        }
      )

      if (syncControlRef.current.aborted) {
        throw new Error('Sincronização abortada pelo usuário')
      }

      const finalMessage = `Sincronização incremental concluída! ${result.stats.new} vídeos novos, ${result.stats.updated} atualizados. Total processado: ${result.stats.processed} vídeos.`

      setProgress({
        step: 'complete',
        current: 5,
        total: 5,
        message: finalMessage
      })

      toast({
        title: "Sincronização Incremental Concluída",
        description: finalMessage,
      })

      markSyncComplete()
      return result

    } catch (error: any) {
      console.error('[SYNC-MANAGER] Erro na sincronização incremental:', error)
      
      if (syncControlRef.current.aborted) {
        setProgress({
          step: 'aborted',
          current: 0,
          total: 5,
          message: 'Sincronização abortada pelo usuário'
        })

        toast({
          title: "Sincronização Abortada",
          description: 'A sincronização foi cancelada pelo usuário.',
          variant: "default",
        })
      } else {
        setProgress({
          step: 'error',
          current: 0,
          total: 5,
          message: `Erro: ${error.message}`
        })

        toast({
          title: "Erro na Sincronização",
          description: error.message || 'Erro durante a sincronização incremental.',
          variant: "destructive",
        })
      }
      
      throw error
    } finally {
      setSyncing(false)
      syncControlRef.current.isRunning = false
    }
  }, [state.hasYouTubeConnection, performSync, setProgress, toast, markSyncComplete])

  const syncAllVideos = useCallback(async (options: SyncOptions) => {
    if (!state.hasYouTubeConnection) {
      toast({
        title: "YouTube não conectado",
        description: "Conecte sua conta do YouTube antes de sincronizar.",
        variant: "destructive",
      })
      return
    }

    console.log('[SYNC-MANAGER] Iniciando sincronização completa de TODOS os vídeos')

    syncControlRef.current = {
      shouldContinue: true,
      isRunning: true,
      aborted: false
    }

    setBatchSync({
      isRunning: true,
      canPause: true,
      isPaused: false,
      totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
      allErrors: [],
      pagesProcessed: 0,
      emptyPages: 0,
      maxEmptyPages: options.maxEmptyPages || 25, // CORREÇÃO: Aumentado para 25
      startTime: Date.now()
    })

    setSyncing(true)

    setProgress({
      step: 'init',
      current: 0,
      total: 20,
      message: 'Iniciando sincronização completa de todos os vídeos...'
    })

    let pageToken: string | undefined = undefined
    let totalProcessed = 0
    let totalNew = 0
    let totalUpdated = 0
    let totalErrors = 0
    let consecutiveEmptyPages = 0
    let pageCount = 0
    const maxEmptyPages = options.maxEmptyPages || 25 // CORREÇÃO: Aumentado para 25
    const deepScan = options.deepScan || false
    const maxPagesLimit = 100 // CORREÇÃO: Limite de segurança para evitar loops infinitos

    try {
      do {
        if (syncControlRef.current.aborted) {
          throw new Error('Sincronização abortada pelo usuário')
        }

        console.log(`[SYNC-MANAGER] Processando página ${pageCount + 1}${pageToken ? ` com token: ${pageToken.substring(0, 20)}...` : ' (primeira página)'}`)

        while (batchSync.isPaused && syncControlRef.current.isRunning && !syncControlRef.current.aborted) {
          console.log('[SYNC-MANAGER] Sincronização pausada')
          setProgress({
            step: 'paused',
            current: pageCount,
            total: Math.max(pageCount + 2, 20),
            message: 'Sincronização pausada...'
          })
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          if (!batchSync.isRunning) {
            syncControlRef.current.isRunning = false
            break
          }
        }

        if (!syncControlRef.current.shouldContinue || !syncControlRef.current.isRunning || syncControlRef.current.aborted) {
          console.log('[SYNC-MANAGER] Parando sincronização por controle ou abort')
          break
        }

        setProgress({
          step: 'processing',
          current: pageCount + 1,
          total: Math.max(pageCount + 2, Math.ceil((totalProcessed || 73) / 50)),
          message: `Processando página ${pageCount + 1}... | Total: ${totalProcessed} vídeos | Novos: ${totalNew} | Atualizados: ${totalUpdated}`
        })

        const syncResult = await performSync(
          { 
            ...options, 
            syncAll: true, 
            pageToken,
            deepScan, 
            maxEmptyPages,
            maxVideos: 50
          },
          (progressUpdate) => {
            if (syncControlRef.current.aborted) {
              throw new Error('Sincronização abortada pelo usuário')
            }

            const estimatedTotal = Math.ceil((progressUpdate.totalVideosEstimated || 73) / 50)
            
            setProgress({
              ...progressUpdate,
              current: pageCount + 1,
              total: Math.max(estimatedTotal, pageCount + 2),
              message: `Página ${pageCount + 1} | ${progressUpdate.message} | Processados: ${totalProcessed + (progressUpdate.pageStats?.videosInPage || 0)} vídeos`,
              pageStats: progressUpdate.pageStats,
              processingSpeed: progressUpdate.processingSpeed,
              totalVideosEstimated: progressUpdate.totalVideosEstimated
            })
          }
        )

        if (!syncResult || syncControlRef.current.aborted) {
          console.log('[SYNC-MANAGER] Resultado nulo da sincronização ou abortado')
          break
        }

        pageToken = syncResult.nextPageToken
        totalProcessed += syncResult.stats.processed
        totalNew += syncResult.stats.new
        totalUpdated += syncResult.stats.updated
        totalErrors += syncResult.stats.errors
        pageCount++

        // CORREÇÃO PRINCIPAL: Lógica corrigida para páginas vazias
        // Uma página só é vazia se a API do YouTube não retornou nenhum vídeo
        const videosReturnedByAPI = syncResult.pageStats?.videosReturnedByAPI || 0
        
        if (videosReturnedByAPI > 0) {
          consecutiveEmptyPages = 0
          console.log(`[SYNC-MANAGER] Página ${pageCount} com ${videosReturnedByAPI} vídeos retornados pela API (${syncResult.stats.processed} processados). Reset contador de páginas vazias.`)
        } else {
          consecutiveEmptyPages++
          console.log(`[SYNC-MANAGER] ⚠️ Página ${pageCount} verdadeiramente vazia - API não retornou vídeos. Consecutivas: ${consecutiveEmptyPages}/${maxEmptyPages}`)
        }

        setBatchSync(prev => ({
          ...prev,
          totalStats: {
            processed: totalProcessed,
            new: totalNew,
            updated: totalUpdated,
            errors: totalErrors
          },
          pagesProcessed: pageCount,
          emptyPages: consecutiveEmptyPages
        }))

        setProgress({
          step: 'processing',
          current: pageCount,
          total: Math.max(pageCount + (pageToken ? 1 : 0), Math.ceil((syncResult.pageStats?.totalChannelVideos || 73) / 50)),
          message: `Página ${pageCount} concluída | API retornou: ${videosReturnedByAPI} vídeos | Processados: ${syncResult.stats.processed} | Total acumulado: ${totalProcessed} | Páginas vazias: ${consecutiveEmptyPages}`,
          pageStats: syncResult.pageStats,
          processingSpeed: syncResult.processingSpeed,
          totalVideosEstimated: syncResult.pageStats?.totalChannelVideos
        })

        console.log(`[SYNC-MANAGER] Página ${pageCount} concluída:`, {
          videosRetornadosAPI: videosReturnedByAPI, // CORREÇÃO: Campo principal para decisão
          processados: syncResult.stats.processed,
          novos: syncResult.stats.new,
          atualizados: syncResult.stats.updated,
          erros: syncResult.stats.errors,
          totalAcumulado: totalProcessed,
          consecutiveEmptyPages,
          maxEmptyPages,
          nextPageToken: pageToken ? 'presente' : 'ausente',
          // CORREÇÃO: Debug detalhado da nova lógica
          paginationLogic: {
            isActuallyEmpty: videosReturnedByAPI === 0,
            hasNewOrUpdated: syncResult.stats.new > 0 || syncResult.stats.updated > 0,
            shouldContinue: !!pageToken && consecutiveEmptyPages < maxEmptyPages,
            withinPageLimit: pageCount < maxPagesLimit
          }
        })

        // CORREÇÃO: Condições de parada baseadas na lógica corrigida
        const shouldStop = 
          !pageToken || // API não retornou nextPageToken (fim natural)
          consecutiveEmptyPages >= maxEmptyPages || // Muitas páginas vazias consecutivas
          pageCount >= maxPagesLimit || // Limite de segurança atingido
          !syncControlRef.current.isRunning ||
          syncControlRef.current.aborted ||
          (!syncResult.hasMorePages)

        if (shouldStop) {
          let reason = 'desconhecido'
          
          if (!pageToken) {
            reason = 'fim natural - API não retornou nextPageToken'
          } else if (consecutiveEmptyPages >= maxEmptyPages) {
            reason = `${consecutiveEmptyPages} páginas vazias consecutivas (limite: ${maxEmptyPages})`
          } else if (pageCount >= maxPagesLimit) {
            reason = `limite de segurança atingido (${maxPagesLimit} páginas)`
          } else if (!syncResult.hasMorePages) {
            reason = 'API indica fim dos vídeos (hasMorePages=false)'
          } else if (syncControlRef.current.aborted) {
            reason = 'abortado pelo usuário'
          } else {
            reason = 'parado pelo usuário'
          }
          
          console.log(`[SYNC-MANAGER] ✅ Parando sincronização: ${reason}`)
          break
        }

        // CORREÇÃO: Delay otimizado entre páginas (800ms em vez de 1200ms)
        if (pageToken && syncControlRef.current.shouldContinue && !syncControlRef.current.aborted) {
          console.log(`[SYNC-MANAGER] Aguardando 800ms antes da próxima página...`)
          await new Promise(resolve => setTimeout(resolve, 800))
        }

      } while (pageToken && syncControlRef.current.shouldContinue && syncControlRef.current.isRunning && !syncControlRef.current.aborted && pageCount < maxPagesLimit)

      if (syncControlRef.current.aborted) {
        throw new Error('Sincronização abortada pelo usuário')
      }

      const finalMessage = deepScan 
        ? `Varredura profunda completa! ${totalProcessed} vídeos processados (${totalNew} novos, ${totalUpdated} atualizados) em ${pageCount} páginas. Páginas vazias consecutivas: ${consecutiveEmptyPages}`
        : `Sincronização completa! ${totalNew} vídeos novos, ${totalUpdated} atualizados. Total: ${totalProcessed} vídeos em ${pageCount} páginas.`

      setProgress({
        step: 'complete',
        current: pageCount,
        total: pageCount,
        message: finalMessage
      })

      console.log('[SYNC-MANAGER] ✅ Sincronização completa finalizada:', {
        totalPages: pageCount,
        totalNew,
        totalUpdated,
        totalProcessed,
        totalErrors,
        consecutiveEmptyPages,
        maxEmptyPages,
        deepScan,
        // CORREÇÃO: Summary final com a nova lógica
        finalSummary: {
          videosPerPage: Math.round(totalProcessed / pageCount),
          avgNewPerPage: Math.round(totalNew / pageCount),
          avgUpdatedPerPage: Math.round(totalUpdated / pageCount),
          completionReason: !pageToken ? 'fim natural (API)' : consecutiveEmptyPages >= maxEmptyPages ? 'páginas vazias' : 'limite atingido',
          lastPageToken: pageToken || 'nenhum',
          emptyPagesLogic: 'corrigida - baseada em videosReturnedByAPI'
        }
      })

      toast({
        title: deepScan ? "Varredura Profunda Completa" : "Sincronização Completa",
        description: finalMessage,
      })

      markSyncComplete()

    } catch (error: any) {
      console.error('[SYNC-MANAGER] Erro na sincronização completa:', error)
      
      if (syncControlRef.current.aborted) {
        setProgress({
          step: 'aborted',
          current: pageCount,
          total: Math.max(pageCount, 20),
          message: 'Sincronização abortada pelo usuário'
        })

        toast({
          title: "Sincronização Abortada",
          description: 'A sincronização foi cancelada pelo usuário.',
          variant: "default",
        })
      } else {
        setProgress({
          step: 'error',
          current: pageCount,
          total: Math.max(pageCount, 20),
          message: `Erro na página ${pageCount + 1}: ${error.message}`
        })

        toast({
          title: "Erro na Sincronização",
          description: error.message || 'Erro durante a sincronização completa.',
          variant: "destructive",
        })
      }
    } finally {
      setSyncing(false)
      setBatchSync(prev => ({ ...prev, isRunning: false }))
      syncControlRef.current = {
        shouldContinue: false,
        isRunning: false,
        aborted: false
      }
    }
  }, [state.hasYouTubeConnection, performSync, setProgress, toast, markSyncComplete, batchSync.isPaused, batchSync.isRunning])

  const pauseBatchSync = useCallback(() => {
    setBatchSync(prev => ({ ...prev, isPaused: true }))
  }, [])

  const resumeBatchSync = useCallback(() => {
    setBatchSync(prev => ({ ...prev, isPaused: false }))
  }, [])

  const stopBatchSync = useCallback(() => {
    syncControlRef.current = {
      shouldContinue: false,
      isRunning: false,
      aborted: false
    }
    setBatchSync(prev => ({ ...prev, isRunning: false, isPaused: false }))
  }, [])

  const abortSync = useCallback(() => {
    console.log('[SYNC-MANAGER] Abortando sincronização...')
    syncControlRef.current = {
      shouldContinue: false,
      isRunning: false,
      aborted: true
    }
    setBatchSync(prev => ({ ...prev, isRunning: false, isPaused: false }))
  }, [])

  return {
    syncing,
    progress,
    syncWithYouTube,
    syncAllVideos,
    batchSync,
    pauseBatchSync,
    resumeBatchSync,
    stopBatchSync,
    abortSync,
    syncState: state
  }
}
