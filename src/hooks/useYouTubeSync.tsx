
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
      logger.info('=== SYNC VALIDATION START ===')
      logger.info('Validating YouTube connection...')
      
      const { data: authData, error: authError } = await supabase.auth.getSession()
      if (authError || !authData.session) {
        logger.error('Authentication failed', { authError })
        throw new Error('User not authenticated')
      }

      logger.info('Auth session validated', { userId: authData.session.user.id })

      const { data: tokenCheck } = await supabase
        .from('youtube_tokens')
        .select('id, channel_id, expires_at, access_token')
        .eq('user_id', authData.session.user.id)
        .maybeSingle()

      if (!tokenCheck) {
        logger.error('No YouTube tokens found in database')
        throw new Error('YouTube not connected')
      }

      logger.info('YouTube tokens found', { 
        channelId: tokenCheck.channel_id,
        tokenExpiry: tokenCheck.expires_at,
        hasAccessToken: !!tokenCheck.access_token
      })

      // Verificar se token está expirado
      const expiresAt = new Date(tokenCheck.expires_at)
      const now = new Date()
      const isExpired = expiresAt <= now
      const expiresInMinutes = Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60)
      
      logger.info('Token expiry check', {
        expiresAt: expiresAt.toISOString(),
        expiresInMinutes,
        isExpired
      })

      if (isExpired) {
        logger.warn('Token is expired, attempting refresh...')
        const refreshed = await refreshTokenIfNeeded()
        if (!refreshed) {
          throw new Error('Token expired and refresh failed')
        }
      }

      logger.info('=== SYNC VALIDATION SUCCESS ===')
      return true
    } catch (error) {
      logger.error('=== SYNC VALIDATION FAILED ===', error)
      return false
    }
  }

  const refreshTokenIfNeeded = async (): Promise<boolean> => {
    try {
      logger.info('Attempting token refresh...')
      
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        logger.error('No session for token refresh')
        return false
      }

      const response = await supabase.functions.invoke('youtube-refresh-token', {
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      logger.info('Token refresh response', {
        hasData: !!response.data,
        hasError: !!response.error,
        errorDetails: response.error
      })

      if (response.error) {
        logger.error('Token refresh failed', response.error)
        return false
      }

      logger.info('Token refreshed successfully')
      return true
    } catch (error) {
      logger.error('Token refresh error', error)
      return false
    }
  }

  const prepareRequestBody = async (options: SyncOptions) => {
    const { data: authData } = await supabase.auth.getSession()
    
    const requestBody = {
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

    logger.info('Request body prepared', {
      optionsKeys: Object.keys(requestBody.options),
      hasUserId: !!requestBody.userId,
      bodySize: JSON.stringify(requestBody).length
    })

    return requestBody
  }

  const testEdgeFunctionConnectivity = async (): Promise<boolean> => {
    try {
      logger.info('=== TESTING EDGE FUNCTION CONNECTIVITY ===')
      
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        logger.error('No auth session for function test')
        return false
      }

      // Teste simples com payload mínimo
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString()
      }

      logger.info('Calling youtube-sync function for connectivity test...', {
        hasAuth: !!authData.session.access_token,
        payload: testPayload
      })

      const response = await supabase.functions.invoke('youtube-sync', {
        body: testPayload,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`
        }
      })

      logger.info('Edge function test response', {
        hasData: !!response.data,
        hasError: !!response.error,
        status: response.status,
        errorMessage: response.error?.message
      })

      return !response.error
    } catch (error) {
      logger.error('Edge function connectivity test failed', error)
      return false
    }
  }

  const callSyncFunction = async (requestBody: any): Promise<SyncResult> => {
    logger.info('=== CALLING SYNC FUNCTION ===')
    logger.info('Sync function call initiated', {
      bodySize: JSON.stringify(requestBody).length,
      optionsPresent: !!requestBody.options,
      timestamp: requestBody.timestamp
    })

    const { data: authData } = await supabase.auth.getSession()
    if (!authData.session) {
      throw new Error('No active session')
    }

    logger.info('Making function call with auth', {
      hasAccessToken: !!authData.session.access_token,
      userId: authData.session.user.id
    })

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
      status: response.status,
      dataKeys: response.data ? Object.keys(response.data) : [],
      errorDetails: response.error
    })

    if (response.error) {
      logger.error('=== SYNC FUNCTION ERROR ===', response.error)
      
      const errorMessage = typeof response.error === 'object' 
        ? response.error.message || response.error.details || 'Unknown error'
        : response.error.toString()

      if (errorMessage.includes('YouTube not connected')) {
        throw new Error('YouTube não conectado. Vá em Configurações > APIs para conectar sua conta.')
      } else if (errorMessage.includes('Authentication required')) {
        throw new Error('Sessão expirada. Faça login novamente.')
      } else if (errorMessage.includes('Token refresh failed')) {
        throw new Error('Token expirado. Reconecte sua conta do YouTube nas configurações.')
      } else if (errorMessage.includes('Empty request body')) {
        throw new Error('Erro de comunicação com o servidor. Dados não enviados corretamente.')
      } else {
        throw new Error(`Erro do servidor: ${errorMessage}`)
      }
    }

    if (!response.data) {
      logger.error('No data received from sync function')
      throw new Error('Nenhum dado recebido do servidor')
    }

    const responseData = response.data as any
    if (!responseData.stats) {
      logger.error('Invalid response format - missing stats', responseData)
      throw new Error('Formato de resposta inválido do servidor')
    }

    logger.info('=== SYNC FUNCTION SUCCESS ===', {
      stats: responseData.stats,
      hasErrors: !!responseData.errors
    })

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
      total: 8, 
      message: 'Iniciando diagnóstico...' 
    })
    
    logger.info('=== STARTING YOUTUBE SYNC ===', { options })

    try {
      // Step 1: Test Edge Function connectivity
      setProgress({ 
        step: 'connectivity', 
        current: 1, 
        total: 8, 
        message: 'Testando conectividade com servidor...' 
      })

      const isConnected = await testEdgeFunctionConnectivity()
      if (!isConnected) {
        throw new Error('Não foi possível conectar com o servidor de sincronização')
      }

      // Step 2: Validate connection
      setProgress({ 
        step: 'validation', 
        current: 2, 
        total: 8, 
        message: 'Validando conexão com YouTube...' 
      })

      const isValid = await validateConnection()
      if (!isValid) {
        throw new Error('YouTube não conectado. Vá em Configurações > APIs para conectar sua conta.')
      }

      // Step 3: Refresh token if needed
      setProgress({ 
        step: 'token-refresh', 
        current: 3, 
        total: 8, 
        message: 'Verificando validade do token...' 
      })

      await refreshTokenIfNeeded()

      // Step 4: Prepare request
      setProgress({ 
        step: 'preparing', 
        current: 4, 
        total: 8, 
        message: 'Preparando dados para sincronização...' 
      })

      const requestBody = await prepareRequestBody(options)

      // Step 5: Call sync function
      setProgress({ 
        step: 'syncing', 
        current: 5, 
        total: 8, 
        message: 'Executando sincronização...' 
      })

      const result = await callSyncFunction(requestBody)

      // Step 6: Process results
      setProgress({ 
        step: 'processing', 
        current: 6, 
        total: 8, 
        message: 'Processando resultados...' 
      })

      logger.info('Sync completed successfully', {
        stats: result.stats,
        hasErrors: !!result.errors,
        errorCount: result.errors?.length || 0
      })

      // Step 7: Validate data in database
      setProgress({ 
        step: 'validation', 
        current: 7, 
        total: 8, 
        message: 'Validando dados na base...' 
      })

      // Step 8: Complete
      setProgress({ 
        step: 'complete', 
        current: 8, 
        total: 8, 
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
      logger.error('=== SYNC ERROR ===', {
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack
      })
      
      setProgress({ 
        step: 'error', 
        current: 0, 
        total: 8, 
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
