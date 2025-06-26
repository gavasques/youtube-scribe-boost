
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

      logger.info('Calling Edge Function', { 
        options,
        hasAuth: !!authData.session?.access_token 
      })

      // Use retry logic for the API call
      const result = await retryWithCondition(
        async () => {
          const response = await supabase.functions.invoke('youtube-sync', {
            body: { options },
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.session!.access_token}`
            }
          })

          if (response.error) {
            logger.error('Sync failed', response.error)
            throw new Error(`Erro na sincronização: ${response.error.message || 'Erro desconhecido'}`)
          }

          if (!response.data) {
            throw new Error('Nenhum dado retornado pelo servidor')
          }

          return response.data as SyncResult
        },
        // Retry condition: retry on network errors but not on auth errors
        (error) => {
          const errorMessage = error.message?.toLowerCase() || ''
          const shouldRetry = !errorMessage.includes('authentication') && 
                             !errorMessage.includes('authorization') &&
                             !errorMessage.includes('não conectado')
          
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
      
      setProgress({ 
        step: 'error', 
        current: 0, 
        total: 3, 
        message: 'Erro na sincronização',
        errors: [error.message || 'Erro desconhecido']
      })
      
      // Don't show toast here - the retry hook will handle it
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
        await new Promise(resolve => setTimeout(resolve, 1000))
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
      
      setProgress({
        step: 'error',
        current: currentPage,
        total: totalPages || currentPage,
        message: 'Erro na sincronização completa',
        errors: [error.message || 'Erro desconhecido'],
        currentPage,
        totalPages,
        videosProcessed: batchSync.totalStats.processed,
        totalVideosEstimated
      })
      
      toast({
        title: 'Erro na sincronização completa',
        description: error.message || 'A sincronização foi interrompida devido a um erro',
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
