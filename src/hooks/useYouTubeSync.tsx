
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useRetry } from '@/hooks/useRetry'
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
}

interface SyncResult {
  stats: SyncStats
  errors?: string[]
  nextPageToken?: string
  hasMorePages: boolean
  currentPage: number
  totalPages?: number
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

  // Retry configuration for YouTube API calls
  const { retryWithCondition } = useRetry({
    maxAttempts: 3,
    delay: 2000,
    backoff: true
  })

  const syncWithYouTube = async (options: SyncOptions): Promise<SyncResult> => {
    setSyncing(true)
    setProgress({ 
      step: 'starting', 
      current: 0, 
      total: 3, 
      message: 'Iniciando sincronização...' 
    })

    try {
      logger.info('Starting YouTube sync', { options })

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

      // Payload estruturado corretamente
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

      // Log detalhado do payload
      console.log('YouTube Sync - Enviando payload:', JSON.stringify(payload, null, 2))
      logger.info('Sending request payload', payload)

      // Use retry logic for the API call
      const result = await retryWithCondition(
        async () => {
          // Teste de comunicação primeiro
          console.log('YouTube Sync - Testando comunicação...')
          
          const testResponse = await supabase.functions.invoke('youtube-sync', {
            body: JSON.stringify({ test: true })
          })

          console.log('YouTube Sync - Test response:', testResponse)

          if (testResponse.error) {
            console.error('YouTube Sync - Test failed:', testResponse.error)
            throw new Error(`Teste de comunicação falhou: ${testResponse.error.message}`)
          }

          // Agora enviar a requisição real
          console.log('YouTube Sync - Enviando requisição real...')
          
          const response = await supabase.functions.invoke('youtube-sync', {
            body: JSON.stringify(payload)
          })

          console.log('YouTube Sync - Raw response:', response)

          if (response.error) {
            console.error('YouTube Sync - Response error:', response.error)
            logger.error('Sync failed', response.error)
            
            // Tratamento específico para diferentes tipos de erro
            const errorMessage = response.error.message || 'Erro desconhecido'
            
            if (errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
              throw new Error('Quota do YouTube API excedida. Tente novamente em algumas horas.')
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
        // Retry condition: retry on network errors but not on auth/quota errors
        (error) => {
          const errorMessage = error.message?.toLowerCase() || ''
          const shouldRetry = !errorMessage.includes('authentication') && 
                             !errorMessage.includes('authorization') &&
                             !errorMessage.includes('não conectado') &&
                             !errorMessage.includes('quota') &&
                             !errorMessage.includes('exceeded') &&
                             !errorMessage.includes('bad request') &&
                             !errorMessage.includes('missing options')
          
          console.log('Retry condition check:', { error: errorMessage, shouldRetry })
          return shouldRetry
        }
      )

      setProgress({ 
        step: 'complete', 
        current: 3, 
        total: 3, 
        message: 'Sincronização concluída!',
        totalVideosEstimated: result.stats.totalEstimated,
        videosProcessed: result.stats.processed
      })

      const statsMessage = `${result.stats.processed} vídeos processados. ${result.stats.new} novos, ${result.stats.updated} atualizados.`
      
      if (result.errors && result.errors.length > 0) {
        toast({
          title: 'Sincronização concluída com avisos',
          description: `${statsMessage} ${result.errors.length} erros encontrados.`,
          variant: 'default'
        })
      } else {
        toast({
          title: 'Sincronização concluída!',
          description: statsMessage,
        })
      }

      logger.info('Sync completed successfully', { stats: result.stats })

      return result

    } catch (error) {
      logger.error('Sync error', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      setProgress({ 
        step: 'error', 
        current: 0, 
        total: 3, 
        message: 'Erro na sincronização',
        errors: [errorMessage]
      })
      
      // Show specific toast for the error
      toast({
        title: 'Erro na sincronização',
        description: errorMessage,
        variant: 'destructive'
      })
      
      throw error
    } finally {
      setSyncing(false)
      setTimeout(() => setProgress(null), 10000)
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
          maxVideos: 50 // Fixed at 50 per page for complete sync
        }

        const result = await syncWithYouTube(syncOptions)

        // Update total stats
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
          totalVideosEstimated,
          nextPageToken: result.nextPageToken
        })

        // Check if there are more pages
        if (!result.hasMorePages || !result.nextPageToken) {
          logger.info('No more pages to process, completing sync')
          break
        }

        pageToken = result.nextPageToken
        currentPage++

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
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
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      setProgress({
        step: 'error',
        current: currentPage,
        total: totalPages || currentPage,
        message: 'Erro na sincronização completa',
        errors: [errorMessage],
        currentPage,
        totalPages,
        videosProcessed: batchSync.totalStats.processed,
        totalVideosEstimated
      })
      
      toast({
        title: 'Erro na sincronização completa',
        description: errorMessage,
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
    resetProgress
  }
}
