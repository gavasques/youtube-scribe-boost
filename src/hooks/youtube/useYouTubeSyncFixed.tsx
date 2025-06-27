
import { useState, useCallback, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/core/Logger'
import { useYouTubeSyncState } from './useYouTubeSyncState'
import type { SyncOptions, SyncProgress } from './types'
import { supabase } from '@/integrations/supabase/client'

export const useYouTubeSyncFixed = () => {
  const { toast } = useToast()
  const { state: syncState, markReady, markError, markSyncComplete } = useYouTubeSyncState()
  
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

  const abortControllerRef = useRef<AbortController | null>(null)

  // Inicialização simplificada
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Verificar autenticação básica
        const { data: authData } = await supabase.auth.getSession()
        if (!authData.session) {
          markError('Usuário não autenticado')
          return
        }

        // Sistema pronto
        markReady()
        logger.info('[SYNC-FIXED] Sistema de sincronização inicializado com sucesso')
      } catch (error) {
        logger.error('[SYNC-FIXED] Erro na inicialização:', error)
        markError('Erro na inicialização do sistema')
      }
    }

    initializeSystem()
  }, [markReady, markError])

  const performSyncRequest = async (options: SyncOptions): Promise<any> => {
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError || !authData.session) {
      throw new Error('Usuário não autenticado')
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
      throw new Error(response.error.message || 'Erro na sincronização')
    }

    return response.data
  }

  const syncWithYouTube = useCallback(async (options: Omit<SyncOptions, 'syncAll' | 'pageToken'>) => {
    if (!syncState.isReady) {
      toast({
        title: "Sistema não pronto",
        description: "O sistema ainda está carregando. Tente novamente em alguns segundos.",
        variant: "destructive",
      })
      return
    }

    setSyncing(true)
    setProgress({ step: 'init', current: 0, total: 1, message: 'Iniciando sincronização...' })

    try {
      const result = await performSyncRequest({ ...options, syncAll: false })

      toast({
        title: "Sincronização Completa",
        description: `Sincronização concluída! Novos: ${result.stats.new}, Atualizados: ${result.stats.updated}, Processados: ${result.stats.processed}`,
      })

      markSyncComplete()
      return result

    } catch (error: any) {
      logger.error('[SYNC-FIXED] Erro durante a sincronização:', error)
      toast({
        title: "Erro na Sincronização",
        description: error.message || 'Ocorreu um erro durante a sincronização.',
        variant: "destructive",
      })
      throw error
    } finally {
      setSyncing(false)
    }
  }, [syncState.isReady, toast, markSyncComplete])

  const syncAllVideos = useCallback(async (options: Omit<SyncOptions, 'syncAll' | 'pageToken'>) => {
    if (!syncState.isReady) {
      toast({
        title: "Sistema não pronto",
        description: "O sistema ainda está carregando. Tente novamente em alguns segundos.",
        variant: "destructive",
      })
      return
    }

    logger.info('[SYNC-FIXED] Iniciando sincronização completa:', options)

    // Inicializar estado do batch sync
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

    let pageToken: string | undefined = undefined
    let totalProcessed = 0
    let totalNew = 0
    let totalUpdated = 0
    let consecutiveEmptyPages = 0
    let pageCount = 0
    const maxEmptyPages = options.maxEmptyPages || 5
    const deepScan = options.deepScan || false

    try {
      do {
        logger.info(`[SYNC-FIXED] Processando página ${pageCount + 1}`)

        setProgress({
          step: 'syncing',
          current: pageCount + 1,
          total: pageCount + 2,
          message: `Sincronizando página ${pageCount + 1}...`
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

        pageToken = syncResult.nextPageToken
        totalProcessed += syncResult.stats.processed
        totalNew += syncResult.stats.new
        totalUpdated += syncResult.stats.updated
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
            errors: prev.totalStats.errors + syncResult.stats.errors
          },
          pagesProcessed: pageCount,
          emptyPages: consecutiveEmptyPages
        }))

        logger.info(`[SYNC-FIXED] Página ${pageCount} concluída. Total: ${totalProcessed} processados, ${totalNew} novos`)

        // Verificar se deve continuar
        const shouldContinue = pageToken && 
          (deepScan || consecutiveEmptyPages < maxEmptyPages) &&
          syncResult.stats.processed > 0

        if (!shouldContinue) {
          logger.info('[SYNC-FIXED] Parando sincronização - critérios de parada atingidos')
          break
        }

        // Aguardar antes da próxima página
        if (pageToken) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

      } while (pageToken)

      logger.info('[SYNC-FIXED] Sincronização completa finalizada:', {
        totalPages: pageCount,
        totalNew,
        totalUpdated,
        totalProcessed,
        consecutiveEmptyPages
      })

      const message = `Sincronização completa! ${totalNew} vídeos novos, ${totalUpdated} atualizados em ${pageCount} páginas processadas.`

      toast({
        title: "Sincronização Completa",
        description: message,
      })

      markSyncComplete()

    } catch (error: any) {
      logger.error('[SYNC-FIXED] Erro na sincronização completa:', error)
      toast({
        title: "Erro na Sincronização",
        description: error.message || 'Ocorreu um erro durante a sincronização completa.',
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
      setBatchSync(prev => ({ ...prev, isRunning: false }))
    }
  }, [syncState.isReady, toast, markSyncComplete])

  const cancelSync = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setSyncing(false)
    setBatchSync(prev => ({ ...prev, isRunning: false, isPaused: false }))
  }, [])

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
    cancelSync,
    batchSync,
    pauseBatchSync,
    resumeBatchSync,
    stopBatchSync,
    syncState
  }
}
