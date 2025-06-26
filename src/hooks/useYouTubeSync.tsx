
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

export function useYouTubeSync() {
  const { toast } = useToast()
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<SyncProgress | null>(null)

  const syncWithYouTube = async (options: SyncOptions): Promise<{ stats: SyncStats; errors?: string[] }> => {
    setSyncing(true)
    setProgress({ step: 'starting', current: 0, total: 5, message: 'Iniciando sincronização...' })
    
    logger.info('=== Starting YouTube sync from frontend ===', { options })

    try {
      // Verificar autenticação
      const { data: authData, error: authError } = await supabase.auth.getSession()
      if (authError || !authData.session) {
        throw new Error('Usuário não autenticado')
      }

      logger.info('User authenticated successfully', { 
        userId: authData.session.user.id,
        tokenPresent: !!authData.session.access_token 
      })

      // Verificar conexão com YouTube
      const { data: tokenCheck } = await supabase
        .from('youtube_tokens')
        .select('id, channel_id, expires_at')
        .eq('user_id', authData.session.user.id)
        .maybeSingle()

      if (!tokenCheck) {
        throw new Error('YouTube não conectado. Vá em Configurações > APIs para conectar sua conta.')
      }

      logger.info('YouTube tokens found', { 
        tokenId: tokenCheck.id,
        channelId: tokenCheck.channel_id,
        expiresAt: tokenCheck.expires_at 
      })

      setProgress({ step: 'validation', current: 1, total: 5, message: 'Validando conexão com YouTube...' })
      await new Promise(resolve => setTimeout(resolve, 500))

      setProgress({ step: 'preparing', current: 2, total: 5, message: 'Preparando dados para envio...' })
      
      // Preparar o body da requisição de forma mais robusta
      const requestBody = {
        options: {
          type: options.type,
          includeRegular: options.includeRegular,
          includeShorts: options.includeShorts,
          syncMetadata: options.syncMetadata,
          maxVideos: options.maxVideos
        },
        timestamp: new Date().toISOString(),
        userId: authData.session.user.id
      }

      logger.info('Request body prepared', { 
        bodyKeys: Object.keys(requestBody),
        optionsKeys: Object.keys(requestBody.options),
        bodySize: JSON.stringify(requestBody).length
      })

      setProgress({ step: 'sending', current: 3, total: 5, message: 'Enviando requisição para o servidor...' })

      logger.info('Calling youtube-sync edge function...')
      
      // Fazer a chamada para a edge function com headers explícitos
      const response = await supabase.functions.invoke('youtube-sync', {
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`
        }
      })

      logger.info('Edge function response received', {
        hasData: !!response.data,
        hasError: !!response.error,
        errorType: response.error ? typeof response.error : 'none',
        dataType: response.data ? typeof response.data : 'none'
      })

      // Log detalhado da resposta
      if (response.error) {
        logger.error('Edge function returned error', {
          error: response.error,
          errorString: JSON.stringify(response.error),
          errorKeys: typeof response.error === 'object' ? Object.keys(response.error) : []
        })
      }

      if (response.data) {
        logger.info('Edge function returned data', {
          data: response.data,
          dataKeys: typeof response.data === 'object' ? Object.keys(response.data) : [],
          hasStats: !!(response.data as any)?.stats
        })
      }

      if (response.error) {
        // Tratamento de erro mais robusto
        let errorMessage = 'Erro na sincronização'
        let errorDetails = ''
        
        if (typeof response.error === 'object' && response.error !== null) {
          const errorObj = response.error as any
          errorMessage = errorObj.message || errorObj.error || errorObj.details || errorMessage
          errorDetails = errorObj.suggestion || errorObj.code || ''
        } else if (typeof response.error === 'string') {
          errorMessage = response.error
        }

        logger.error('Processing error message', { errorMessage, errorDetails })

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
        logger.error('No data received from edge function')
        throw new Error('Nenhum dado recebido do servidor')
      }

      const responseData = response.data as any

      if (!responseData.stats) {
        logger.error('Invalid response format - missing stats', { responseData })
        throw new Error('Formato de resposta inválido do servidor')
      }

      logger.info('Sync completed successfully', { 
        stats: responseData.stats,
        hasErrors: !!responseData.errors,
        errorCount: responseData.errors?.length || 0
      })

      setProgress({ step: 'complete', current: 5, total: 5, message: 'Sincronização concluída!' })

      toast({
        title: 'Sincronização concluída!',
        description: `${responseData.stats.processed} vídeos processados. ${responseData.stats.new} novos, ${responseData.stats.updated} atualizados.`,
      })

      return {
        stats: responseData.stats,
        errors: responseData.errors
      }

    } catch (error) {
      logger.error('=== Error in frontend sync ===', {
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack
      })
      
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
      setTimeout(() => setProgress(null), 5000)
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
