
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

export function useYouTubeSync() {
  const { toast } = useToast()
  const [syncing, setSyncing] = useState(false)

  const syncWithYouTube = async (options: SyncOptions): Promise<{ stats: SyncStats; errors?: string[] }> => {
    setSyncing(true)
    console.log('=== Starting YouTube sync ===')
    console.log('Sync options:', options)

    try {
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('Não autenticado')
      }

      console.log('User authenticated, calling sync function...')

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
      toast({
        title: 'Erro na sincronização',
        description: error.message || 'Não foi possível sincronizar com o YouTube',
        variant: 'destructive'
      })
      throw error
    } finally {
      setSyncing(false)
    }
  }

  return {
    syncing,
    syncWithYouTube
  }
}
