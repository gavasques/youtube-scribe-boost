
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
    
    console.log('=== Starting YouTube sync from frontend ===')
    console.log('Sync options:', options)

    try {
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('Usuário não autenticado')
      }

      console.log('User authenticated, preparing request...')

      // Simular progresso inicial
      setProgress({ step: 'validation', current: 1, total: 5, message: 'Validando conexão com YouTube...' })
      await new Promise(resolve => setTimeout(resolve, 500))

      setProgress({ step: 'fetching', current: 2, total: 5, message: 'Enviando requisição para o servidor...' })
      
      // Preparar o body da requisição
      const requestBody = { options }
      console.log('Request body to be sent:', requestBody)

      console.log('Calling youtube-sync edge function...')
      const response = await supabase.functions.invoke('youtube-sync', {
        body: requestBody,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Edge function response received:', {
        data: response.data,
        error: response.error,
        status: response.status
      })

      if (response.error) {
        console.error('Edge function returned error:', response.error)
        
        // Tentar extrair uma mensagem de erro mais específica
        let errorMessage = 'Erro na sincronização'
        let errorDetails = ''
        
        if (typeof response.error === 'object') {
          errorMessage = response.error.message || response.error.error || errorMessage
          errorDetails = response.error.details || response.error.suggestion || ''
        } else if (typeof response.error === 'string') {
          errorMessage = response.error
        }

        // Mostrar erro específico baseado no tipo
        if (errorMessage.includes('YouTube not connected') || errorMessage.includes('No YouTube tokens found')) {
          throw new Error('YouTube não conectado. Vá em Configurações > APIs para conectar sua conta.')
        } else if (errorMessage.includes('Empty request body')) {
          throw new Error('Erro na comunicação. Tente novamente em alguns segundos.')
        } else if (errorMessage.includes('Unauthorized')) {
          throw new Error('Sessão expirada. Faça login novamente.')
        } else {
          throw new Error(`${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`)
        }
      }

      if (!response.data) {
        console.error('No data received from edge function')
        throw new Error('Nenhum dado recebido do servidor')
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
      console.error('=== Error in frontend sync ===')
      console.error('Error type:', error.constructor.name)
      console.error('Error message:', error.message)
      
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
