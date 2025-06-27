
import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/core/Logger'
import { useYouTubeSyncState } from './useYouTubeSyncState'
import { useYouTubeAuth } from '@/hooks/useYouTubeAuth'
import type { SyncOptions, SyncProgress } from './types'
import { supabase } from '@/integrations/supabase/client'

export const useYouTubeSyncFixed = () => {
  const { toast } = useToast()
  const { state: syncState, markReady, markError, markSyncComplete, updateConnectionStatus } = useYouTubeSyncState()
  const { isConnected, tokens, checkConnection } = useYouTubeAuth()
  
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<SyncProgress>({
    step: '',
    current: 0,
    total: 0,
    message: ''
  })

  const [batchSync, setBatchSync] = useState({
    isRunning: false,
    canPause: false,
    isPaused: false,
    totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
    allErrors: [],
    pagesProcessed: 0,
    emptyPages: 0,
    maxEmptyPages: 5,
    startTime: undefined,
    lastPageStats: undefined,
    overallSpeed: undefined
  })

  // Inicialização com verificação de conexão YouTube
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        logger.info('[SYNC-FIXED] Inicializando sistema de sincronização...')
        
        // Verificar autenticação do usuário
        const { data: authData } = await supabase.auth.getSession()
        if (!authData.session) {
          markError('Usuário não autenticado')
          return
        }

        // Verificar conexão YouTube
        await checkConnection()
        
        // Aguardar um pouco para o hook useYouTubeAuth atualizar
        setTimeout(() => {
          if (isConnected && tokens) {
            logger.info('[SYNC-FIXED] YouTube conectado, sistema pronto')
            markReady(true)
          } else {
            logger.warn('[SYNC-FIXED] YouTube não conectado')
            markReady(false)
          }
        }, 1000)

      } catch (error) {
        logger.error('[SYNC-FIXED] Erro na inicialização:', error)
        markError('Erro na inicialização do sistema')
      }
    }

    initializeSystem()
  }, [markReady, markError, checkConnection])

  // Monitorar mudanças na conexão YouTube
  useEffect(() => {
    updateConnectionStatus(isConnected && !!tokens)
  }, [isConnected, tokens, updateConnectionStatus])

  const performSyncRequest = async (options: SyncOptions): Promise<any> => {
    // Verificação robusta de autenticação
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError || !authData.session) {
      throw new Error('Usuário não autenticado')
    }

    // Verificação obrigatória de conexão YouTube
    if (!isConnected || !tokens) {
      throw new Error('YouTube não conectado. Conecte sua conta primeiro.')
    }

    logger.info('[SYNC-FIXED] Iniciando requisição de sincronização:', options)

    const response = await supabase.functions.invoke('youtube-sync', {
      body: { options },
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.error) {
      logger.error('[SYNC-FIXED] Erro na Edge Function:', response.error)
      throw new Error(response.error.message || 'Erro na sincronização')
    }

    if (!response.data) {
      throw new Error('Resposta vazia da sincronização')
    }

    return response.data
  }

  const syncWithYouTube = useCallback(async (options: Omit<SyncOptions, 'syncAll' | 'pageToken'>) => {
    if (!syncState.hasYouTubeConnection) {
      toast({
        title: "YouTube não conectado",
        description: "Conecte sua conta do YouTube antes de sincronizar.",
        variant: "destructive",
      })
      return
    }

    setSyncing(true)
    setProgress({ step: 'init', current: 0, total: 1, message: 'Verificando conexão YouTube...' })

    try {
      // Verificação adicional de conexão no início
      if (!isConnected || !tokens) {
        throw new Error('YouTube não conectado')
      }

      setProgress({ step: 'sync', current: 0, total: 1, message: 'Sincronizando com YouTube...' })

      const result = await performSyncRequest({ ...options, syncAll: false })

      logger.info('[SYNC-FIXED] Sincronização rápida concluída:', result.stats)

      toast({
        title: "Sincronização Concluída",
        description: `Novos: ${result.stats.new}, Atualizados: ${result.stats.updated}, Processados: ${result.stats.processed}`,
      })

      markSyncComplete()
      return result

    } catch (error: any) {
      logger.error('[SYNC-FIXED] Erro durante a sincronização:', error)
      
      if (error.message.includes('YouTube não conectado')) {
        toast({
          title: "YouTube Desconectado",
          description: "Sua conta do YouTube foi desconectada. Reconecte antes de sincronizar.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Erro na Sincronização",
          description: error.message || 'Ocorreu um erro durante a sincronização.',
          variant: "destructive",
        })
      }
      throw error
    } finally {
      setSyncing(false)
    }
  }, [syncState.hasYouTubeConnection, isConnected, tokens, toast, markSyncComplete])

  const syncAllVideos = useCallback(async (options: Omit<SyncOptions, 'syncAll' | 'pageToken'>) => {
    if (!syncState.hasYouTubeConnection) {
      toast({
        title: "YouTube não conectado",
        description: "Conecte sua conta do YouTube antes de sincronizar todos os vídeos.",
        variant: "destructive",
      })
      return
    }

    logger.info('[SYNC-FIXED] Iniciando sincronização completa de TODOS os vídeos')

    // Resetar estado do batch sync
    setBatchSync({
      isRunning: true,
      canPause: true,
      isPaused: false,
      totalStats: { processed: 0, new: 0, updated: 0, errors: 0 },
      allErrors: [],
      pagesProcessed: 0,
      emptyPages: 0,
      maxEmptyPages: options.maxEmptyPages || 5,
      startTime: Date.now(),
      lastPageStats: undefined,
      overallSpeed: undefined
    })

    setSyncing(true)
    setProgress({ step: 'init', current: 0, total: 1, message: 'Iniciando sincronização completa...' })

    let pageToken: string | undefined = undefined
    let totalProcessed = 0
    let totalNew = 0
    let totalUpdated = 0
    let totalErrors = 0
    let consecutiveEmptyPages = 0
    let pageCount = 0
    const maxEmptyPages = options.maxEmptyPages || 5
    const deepScan = options.deepScan || false

    try {
      // Verificação inicial de conexão
      if (!isConnected || !tokens) {
        throw new Error('YouTube não conectado')
      }

      do {
        logger.info(`[SYNC-FIXED] Processando página ${pageCount + 1}${pageToken ? ` com token: ${pageToken.substring(0, 20)}...` : ' (primeira página)'}`)

        setProgress({
          step: 'syncing',
          current: pageCount + 1,
          total: Math.max(pageCount + 2, 15), // Estimativa baseada nos 73 vídeos
          message: `Processando página ${pageCount + 1}... (${totalProcessed} vídeos processados)`
        })

        const syncResult = await performSyncRequest({
          ...options,
          syncAll: true,
          pageToken,
          deepScan,
          maxEmptyPages
        })

        if (!syncResult) {
          logger.error('[SYNC-FIXED] Resultado nulo da sincronização')
          break
        }

        // Atualizar contadores
        pageToken = syncResult.nextPageToken
        totalProcessed += syncResult.stats.processed
        totalNew += syncResult.stats.new
        totalUpdated += syncResult.stats.updated
        totalErrors += syncResult.stats.errors
        pageCount++

        const hasNewVideos = syncResult.stats.new > 0
        if (hasNewVideos) {
          consecutiveEmptyPages = 0
        } else {
          consecutiveEmptyPages++
        }

        // Atualizar estado do batch
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

        logger.info(`[SYNC-FIXED] Página ${pageCount} concluída:`, {
          processados: syncResult.stats.processed,
          novos: syncResult.stats.new,
          atualizados: syncResult.stats.updated,
          erros: syncResult.stats.errors,
          totalAcumulado: totalProcessed
        })

        // Verificar se deve continuar (para deepScan, continua até não haver mais páginas)
        const shouldContinue = pageToken && 
          (deepScan || consecutiveEmptyPages < maxEmptyPages) &&
          syncResult.stats.processed > 0

        if (!shouldContinue) {
          const reason = !pageToken ? 'sem mais páginas' : 
                        consecutiveEmptyPages >= maxEmptyPages ? `${consecutiveEmptyPages} páginas vazias consecutivas` :
                        'sem vídeos processados'
          logger.info(`[SYNC-FIXED] Parando sincronização: ${reason}`)
          break
        }

        // Aguardar antes da próxima página (respeitar rate limits)
        if (pageToken) {
          await new Promise(resolve => setTimeout(resolve, 1500))
        }

      } while (pageToken)

      const message = deepScan 
        ? `Varredura profunda completa! ${totalProcessed} vídeos processados (${totalNew} novos, ${totalUpdated} atualizados) em ${pageCount} páginas.`
        : `Sincronização completa! ${totalNew} vídeos novos, ${totalUpdated} atualizados. Total: ${totalProcessed} vídeos em ${pageCount} páginas.`

      logger.info('[SYNC-FIXED] Sincronização completa finalizada:', {
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
      logger.error('[SYNC-FIXED] Erro na sincronização completa:', error)
      
      if (error.message.includes('YouTube não conectado')) {
        toast({
          title: "YouTube Desconectado",
          description: "Sua conta do YouTube foi desconectada durante a sincronização.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Erro na Sincronização Completa",
          description: error.message || 'Erro durante a sincronização completa.',
          variant: "destructive",
        })
      }
    } finally {
      setSyncing(false)
      setBatchSync(prev => ({ ...prev, isRunning: false }))
    }
  }, [syncState.hasYouTubeConnection, isConnected, tokens, toast, markSyncComplete])

  const pauseBatchSync = useCallback(() => {
    setBatchSync(prev => ({ ...prev, isPaused: true }))
  }, [])

  const resumeBatchSync = useCallback(() => {
    setBatchSync(prev => ({ ...prev, isPaused: false }))
  }, [])

  const stopBatchSync = useCallback(() => {
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
    syncState
  }
}
