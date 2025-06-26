
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

export function useYouTubeSync() {
  const { toast } = useToast()
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<SyncProgress | null>(null)

  const syncWithYouTube = async (options: SyncOptions): Promise<{ stats: SyncStats; errors?: string[] }> => {
    setSyncing(true)
    setProgress({ step: 'starting', current: 0, total: 5, message: 'Iniciando sincronização...' })
    
    console.log('=== Starting YouTube sync ===')
    console.log('Sync options:', options)

    try {
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('Não autenticado')
      }

      console.log('User authenticated, calling sync function...')

      // Simular progresso inicial
      setProgress({ step: 'validation', current: 1, total: 5, message: 'Validando conexão com YouTube...' })
      await new Promise(resolve => setTimeout(resolve, 500))

      setProgress({ step: 'fetching', current: 2, total: 5, message: 'Buscando lista de vídeos...' })
      await new Promise(resolve => setTimeout(resolve, 500))

      const response = await supabase.functions.invoke('youtube-sync', {
        body: { options },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Sync function response:', response)

      if (response.error) {
        console.error('Sync function error:', response.error)
        throw new Error(response.error.message || 'Erro na função de sincronização')
      }

      console.log('Sync completed successfully:', response.data)

      setProgress({ step: 'complete', current: 5, total: 5, message: 'Sincronização concluída!' })

      toast({
        title: 'Sincronização concluída!',
        description: `${response.data.stats.processed} vídeos processados. ${response.data.stats.new} novos, ${response.data.stats.updated} atualizados.`,
      })

      return {
        stats: response.data.stats,
        errors: response.data.errors
      }

    } catch (error) {
      console.error('Erro na sincronização:', error)
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
      // Limpar progresso após um tempo
      setTimeout(() => setProgress(null), 3000)
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
