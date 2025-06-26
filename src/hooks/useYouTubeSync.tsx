
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

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
      total: 5, 
      message: 'Iniciando sincronização...' 
    })

    try {
      // Step 1: Test connectivity
      setProgress({ 
        step: 'connectivity', 
        current: 1, 
        total: 5, 
        message: 'Testando conectividade...' 
      })

      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('Usuário não autenticado')
      }

      // Step 2: Test edge function
      setProgress({ 
        step: 'testing', 
        current: 2, 
        total: 5, 
        message: 'Verificando servidor...' 
      })

      const testResponse = await supabase.functions.invoke('youtube-sync', {
        body: { test: true },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`
        }
      })

      if (testResponse.error) {
        console.error('Test failed:', testResponse.error)
        throw new Error('Falha na conectividade com o servidor')
      }

      // Step 3: Prepare sync
      setProgress({ 
        step: 'preparing', 
        current: 3, 
        total: 5, 
        message: 'Preparando sincronização...' 
      })

      const requestBody = {
        options: {
          type: options.type,
          includeRegular: options.includeRegular,
          includeShorts: options.includeShorts,
          syncMetadata: options.syncMetadata,
          maxVideos: options.maxVideos
        },
        timestamp: new Date().toISOString()
      }

      // Step 4: Execute sync
      setProgress({ 
        step: 'syncing', 
        current: 4, 
        total: 5, 
        message: 'Sincronizando vídeos...' 
      })

      const syncResponse = await supabase.functions.invoke('youtube-sync', {
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`
        }
      })

      if (syncResponse.error) {
        console.error('Sync failed:', syncResponse.error)
        throw new Error(`Erro na sincronização: ${syncResponse.error.message || 'Erro desconhecido'}`)
      }

      if (!syncResponse.data) {
        throw new Error('Nenhum dado retornado pelo servidor')
      }

      const result = syncResponse.data as { stats: SyncStats; errors?: string[] }

      // Step 5: Complete
      setProgress({ 
        step: 'complete', 
        current: 5, 
        total: 5, 
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

      return {
        stats: result.stats,
        errors: result.errors
      }

    } catch (error) {
      console.error('Sync error:', error)
      
      setProgress({ 
        step: 'error', 
        current: 0, 
        total: 5, 
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
