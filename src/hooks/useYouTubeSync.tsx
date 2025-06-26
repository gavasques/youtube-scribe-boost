
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/core/Logger'

interface SyncOptions {
  type: 'full' | 'incremental'
  includeRegular: boolean
  includeShorts: boolean
  syncMetadata: boolean
  maxVideos: number
}

interface SyncStats {
  processed: number
  new: number
  updated: number
  errors: number
}

interface SyncProgress {
  step: string
  current: number
  total: number
  message: string
  errors?: string[]
}

interface SyncResult {
  stats: SyncStats
  errors?: string[]
}

export function useYouTubeSync() {
  const { toast } = useToast()
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<SyncProgress | null>(null)

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

      // Step 1: Verificar autenticação
      setProgress({ 
        step: 'auth', 
        current: 1, 
        total: 3, 
        message: 'Verificando autenticação...' 
      })

      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('Usuário não autenticado')
      }

      // Step 2: Executar sincronização
      setProgress({ 
        step: 'syncing', 
        current: 2, 
        total: 3, 
        message: 'Sincronizando vídeos...' 
      })

      logger.info('Calling Edge Function', { 
        options,
        hasAuth: !!authData.session?.access_token 
      })

      const response = await supabase.functions.invoke('youtube-sync', {
        body: { options },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`
        }
      })

      logger.info('Edge Function Response', { 
        error: response.error,
        data: response.data 
      })

      if (response.error) {
        logger.error('Sync failed', response.error)
        throw new Error(`Erro na sincronização: ${response.error.message || 'Erro desconhecido'}`)
      }

      if (!response.data) {
        throw new Error('Nenhum dado retornado pelo servidor')
      }

      const result = response.data as { stats: SyncStats; errors?: string[] }

      // Step 3: Concluído
      setProgress({ 
        step: 'complete', 
        current: 3, 
        total: 3, 
        message: 'Sincronização concluída!' 
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

      return {
        stats: result.stats,
        errors: result.errors
      }

    } catch (error) {
      logger.error('Sync error', error)
      
      setProgress({ 
        step: 'error', 
        current: 0, 
        total: 3, 
        message: 'Erro na sincronização',
        errors: [error.message || 'Erro desconhecido']
      })
      
      toast({
        title: 'Erro na sincronização',
        description: error.message || 'Não foi possível sincronizar com o YouTube',
        variant: 'destructive'
      })
      
      throw error
    } finally {
      setSyncing(false)
      setTimeout(() => setProgress(null), 10000)
    }
  }

  const resetProgress = () => {
    setProgress(null)
  }

  return {
    syncing,
    progress,
    syncWithYouTube,
    resetProgress
  }
}
