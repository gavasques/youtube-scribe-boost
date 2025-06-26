
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

  const validateConnection = async (): Promise<boolean> => {
    try {
      logger.info('Validating YouTube connection...')
      
      const { data: authData, error: authError } = await supabase.auth.getSession()
      if (authError || !authData.session) {
        throw new Error('User not authenticated')
      }

      const { data: tokenCheck } = await supabase
        .from('youtube_tokens')
        .select('id, channel_id, expires_at')
        .eq('user_id', authData.session.user.id)
        .maybeSingle()

      if (!tokenCheck) {
        throw new Error('YouTube not connected')
      }

      logger.info('YouTube connection validated', { 
        channelId: tokenCheck.channel_id,
        tokenExpiry: tokenCheck.expires_at 
      })

      return true
    } catch (error) {
      logger.error('YouTube connection validation failed', error)
      return false
    }
  }

  const prepareRequestBody = async (options: SyncOptions) => {
    const { data: authData } = await supabase.auth.getSession()
    
    return {
      options: {
        type: options.type,
        includeRegular: options.includeRegular,
        includeShorts: options.includeShorts,
        syncMetadata: options.syncMetadata,
        maxVideos: options.maxVideos
      },
      timestamp: new Date().toISOString(),
      userId: authData?.session?.user.id
    }
  }

  const callSyncFunction = async (requestBody: any): Promise<SyncResult> => {
    logger.info('Calling YouTube sync function...', {
      bodySize: JSON.stringify(requestBody).length,
      optionsPresent: !!requestBody.options
    })

    const { data: authData } = await supabase.auth.getSession()
    if (!authData.session) {
      throw new Error('No active session')
    }

    const response = await supabase.functions.invoke('youtube-sync', {
      body: requestBody,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`
      }
    })

    logger.info('Sync function response received', {
      hasData: !!response.data,
      hasError: !!response.error,
      dataKeys: response.data ? Object.keys(response.data) : [],
      errorDetails: response.error
    })

    if (response.error) {
      logger.error('Sync function returned error', response.error)
      
      // Handle specific error types
      const errorMessage = typeof response.error === 'object' 
        ? response.error.message || response.error.details || 'Unknown error'
        : response.error.toString()

      if (errorMessage.includes('YouTube not connected')) {
        throw new Error('YouTube não conectado. Vá em Configurações > APIs para conectar sua conta.')
      } else if (errorMessage.includes('Authentication required')) {
        throw new Error('Sessão expirada. Faça login novamente.')
      } else if (errorMessage.includes('Token refresh failed')) {
        throw new Error('Token expirado. Reconecte sua conta do YouTube nas configurações.')
      } else {
        throw new Error(errorMessage)
      }
    }

    if (!response.data) {
      throw new Error('Nenhum dado recebido do servidor')
    }

    const responseData = response.data as any
    if (!responseData.stats) {
      logger.error('Invalid response format', responseData)
      throw new Error('Formato de resposta inválido do servidor')
    }

    return {
      stats: responseData.stats,
      errors: responseData.errors
    }
  }

  const syncWithYouTube = async (options: SyncOptions): Promise<SyncResult> => {
    setSyncing(true)
    setProgress({ 
      step: 'starting', 
      current: 0, 
      total: 6, 
      message: 'Iniciando sincronização...' 
    })
    
    logger.info('=== Starting YouTube sync ===', { options })

    try {
      // Step 1: Validate connection
      setProgress({ 
        step: 'validation', 
        current: 1, 
        total: 6, 
        message: 'Validando conexão com YouTube...' 
      })

      const isConnected = await validateConnection()
      if (!isConnected) {
        throw new Error('YouTube não conectado. Vá em Configurações > APIs para conectar sua conta.')
      }

      // Step 2: Prepare request
      setProgress({ 
        step: 'preparing', 
        current: 2, 
        total: 6, 
        message: 'Preparando dados para sincronização...' 
      })

      const requestBody = await prepareRequestBody(options)
      logger.info('Request body prepared', {
        bodyKeys: Object.keys(requestBody),
        optionsValid: !!requestBody.options
      })

      // Step 3: Call sync function
      setProgress({ 
        step: 'syncing', 
        current: 3, 
        total: 6, 
        message: 'Sincronizando com YouTube...' 
      })

      const result = await callSyncFunction(requestBody)

      // Step 4: Process results
      setProgress({ 
        step: 'processing', 
        current: 4, 
        total: 6, 
        message: 'Processando resultados...' 
      })

      logger.info('Sync completed successfully', {
        stats: result.stats,
        hasErrors: !!result.errors,
        errorCount: result.errors?.length || 0
      })

      // Step 5: Show results
      setProgress({ 
        step: 'complete', 
        current: 6, 
        total: 6, 
        message: 'Sincronização concluída com sucesso!' 
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

      return result

    } catch (error) {
      logger.error('=== Error in YouTube sync ===', {
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack
      })
      
      setProgress({ 
        step: 'error', 
        current: 0, 
        total: 6, 
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
      // Clear progress after delay
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
