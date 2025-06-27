
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
    maxEmptyPages: 5
  })

  const syncControlRef = useRef({
    shouldContinue: true,
    isRunning: false
  })

  // Inicialização do sistema
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

  // Monitorar mudanças na conexão
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

    console.log('[SYNC-MANAGER] Iniciando sincronização rápida')
    setSyncing(true)

    try {
      const result = await performSync(
        { ...options, syncAll: false },
        setProgress
      )

      toast({
        title: "Sincronização Concluída",
        description: `Novos: ${result.stats.new}, Atualizados: ${result.stats.updated}, Processados: ${result.stats.processed}`,
      })

      markSyncComplete()
      return result

    } catch (error: any) {
      console.error('[SYNC-MANAGER] Erro na sincronização:', error)
      
      toast({
        title: "Erro na Sincronização",
        description: error.message || 'Erro durante a sincronização.',
        variant: "destructive",
      })
      throw error
    } finally {
      setSyncing(false)
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

    // Resetar controle de sincronização
    syncControlRef.current = {
      shouldContinue: true,
      isRunning: true
    }

    setBatchSync({
      isRunning: true,
      canPause: true,
      isPaused: false,
      totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
      allErrors: [],
      pagesProcessed: 0,
      emptyPages: 0,
      maxEmptyPages: options.maxEmptyPages || 10,
      startTime: Date.now()
    })

    setSyncing(true)

    let pageToken: string | undefined = undefined
    let totalProcessed = 0
    let totalNew = 0
    let totalUpdated = 0
    let totalErrors = 0
    let consecutiveEmptyPages = 0
    let pageCount = 0
    const maxEmptyPages = options.maxEmptyPages || 10
    const deepScan = options.deepScan || false

    try {
      do {
        console.log(`[SYNC-MANAGER] Processando página ${pageCount + 1}${pageToken ? ` com token: ${pageToken.substring(0, 20)}...` : ' (primeira página)'}`)

        // Verificar se deve pausar
        while (batchSync.isPaused && syncControlRef.current.isRunning) {
          console.log('[SYNC-MANAGER] Sincronização pausada')
          setProgress({
            step: 'paused',
            current: pageCount,
            total: Math.max(pageCount + 2, 15),
            message: 'Sincronização pausada...'
          })
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          if (!batchSync.isRunning) {
            syncControlRef.current.isRunning = false
            break
          }
        }

        if (!syncControlRef.current.shouldContinue || !syncControlRef.current.isRunning) {
          console.log('[SYNC-MANAGER] Parando sincronização por controle')
          break
        }

        const syncResult = await performSync(
          { ...options, syncAll: true, pageToken, deepScan, maxEmptyPages },
          (progressUpdate) => {
            const enhancedMessage = `${progressUpdate.message} (Página ${pageCount + 1}${consecutiveEmptyPages > 0 ? `, ${consecutiveEmptyPages} páginas vazias` : ''})`
            
            setProgress({
              ...progressUpdate,
              message: enhancedMessage,
              current: pageCount + 1,
              total: Math.max(pageCount + 2, Math.ceil((progressUpdate.totalVideosEstimated || 73) / 50))
            })
          }
        )

        if (!syncResult) {
          console.error('[SYNC-MANAGER] Resultado nulo da sincronização')
          break
        }

        pageToken = syncResult.nextPageToken
        totalProcessed += syncResult.stats.processed
        totalNew += syncResult.stats.new
        totalUpdated += syncResult.stats.updated
        totalErrors += syncResult.stats.errors
        pageCount++

        const hasNewVideos = syncResult.pageStats?.newInPage > 0
        if (hasNewVideos) {
          consecutiveEmptyPages = 0
        } else {
          consecutiveEmptyPages++
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

        console.log(`[SYNC-MANAGER] Página ${pageCount} concluída:`, {
          processados: syncResult.stats.processed,
          novos: syncResult.stats.new,
          atualizados: syncResult.stats.updated,
          erros: syncResult.stats.errors,
          totalAcumulado: totalProcessed,
          hasNewVideos,
          consecutiveEmptyPages
        })

        // Verificar se deve continuar
        const shouldContinue = pageToken && 
          (deepScan || consecutiveEmptyPages < maxEmptyPages) &&
          syncResult.stats.processed > 0 &&
          syncControlRef.current.isRunning

        if (!shouldContinue) {
          const reason = !pageToken ? 'sem mais páginas' : 
                        consecutiveEmptyPages >= maxEmptyPages ? `${consecutiveEmptyPages} páginas vazias consecutivas` :
                        !syncResult.stats.processed ? 'sem vídeos processados' :
                        'parado pelo usuário'
          console.log(`[SYNC-MANAGER] Parando sincronização: ${reason}`)
          break
        }

        // Aguardar antes da próxima página
        if (pageToken && syncControlRef.current.shouldContinue) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

      } while (pageToken && syncControlRef.current.shouldContinue && syncControlRef.current.isRunning)

      const message = deepScan 
        ? `Varredura profunda completa! ${totalProcessed} vídeos processados (${totalNew} novos, ${totalUpdated} atualizados) em ${pageCount} páginas.`
        : `Sincronização completa! ${totalNew} vídeos novos, ${totalUpdated} atualizados. Total: ${totalProcessed} vídeos em ${pageCount} páginas.`

      console.log('[SYNC-MANAGER] Sincronização completa finalizada:', {
        totalPages: pageCount,
        totalNew,
        totalUpdated,
        totalProcessed,
        totalErrors,
        deepScan
      })

      toast({
        title: deepScan ? "Varredura Profunda Completa" : "Sincronização Completa",
        description: message,
      })

      markSyncComplete()

    } catch (error: any) {
      console.error('[SYNC-MANAGER] Erro na sincronização completa:', error)
      
      toast({
        title: "Erro na Sincronização",
        description: error.message || 'Erro durante a sincronização completa.',
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
      setBatchSync(prev => ({ ...prev, isRunning: false }))
      syncControlRef.current = {
        shouldContinue: false,
        isRunning: false
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
      isRunning: false
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
    syncState: state
  }
}
