
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface YouTubeChannel {
  id: string
  name: string
  thumbnail: string
  subscriberCount: number
}

interface YouTubeTokens {
  id: string
  access_token: string
  refresh_token: string
  expires_at: string
  scope: string
  channel_id: string | null
  channel_name: string | null
  channel_thumbnail: string | null
  subscriber_count: number | null
  created_at: string
  updated_at: string
}

export function useYouTubeAuth() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState<YouTubeTokens | null>(null)
  const [connecting, setConnecting] = useState(false)

  // Verificar se já existe conexão
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    checkConnection()
  }, [user])

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('youtube_tokens')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error) {
        console.error('Error checking YouTube connection:', error)
        return
      }

      if (data) {
        setTokens(data)
        setIsConnected(true)
      } else {
        setIsConnected(false)
        setTokens(null)
      }
    } catch (error) {
      console.error('Error checking connection:', error)
    } finally {
      setLoading(false)
    }
  }

  const startOAuth = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para conectar ao YouTube",
        variant: "destructive"
      })
      return
    }

    setConnecting(true)

    try {
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('No active session')
      }

      const response = await supabase.functions.invoke('youtube-oauth-start', {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      const { authUrl, state } = response.data

      // Salvar state no localStorage para verificação
      localStorage.setItem('youtube_oauth_state', state)

      // Redirecionar para OAuth
      window.location.href = authUrl

    } catch (error) {
      console.error('Error starting OAuth:', error)
      toast({
        title: "Erro na autenticação",
        description: "Não foi possível iniciar a conexão com o YouTube",
        variant: "destructive"
      })
      setConnecting(false)
    }
  }

  const handleCallback = async (code: string, state: string, error?: string) => {
    setConnecting(true)

    try {
      if (error) {
        throw new Error(`OAuth error: ${error}`)
      }

      // Verificar state
      const savedState = localStorage.getItem('youtube_oauth_state')
      if (state !== savedState) {
        throw new Error('Invalid state parameter')
      }

      const response = await supabase.functions.invoke('youtube-oauth-callback', {
        body: { code, state, error }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      // Limpar state do localStorage
      localStorage.removeItem('youtube_oauth_state')

      toast({
        title: "Conectado com sucesso!",
        description: `Canal ${response.data.channel.name} conectado`
      })

      // Recarregar dados da conexão
      await checkConnection()

    } catch (error) {
      console.error('Error in OAuth callback:', error)
      toast({
        title: "Erro na autenticação",
        description: "Não foi possível completar a conexão com o YouTube",
        variant: "destructive"
      })
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('youtube_tokens')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      setIsConnected(false)
      setTokens(null)

      toast({
        title: "Desconectado",
        description: "Conexão com YouTube removida com sucesso"
      })

    } catch (error) {
      console.error('Error disconnecting:', error)
      toast({
        title: "Erro",
        description: "Não foi possível desconectar do YouTube",
        variant: "destructive"
      })
    }
  }

  const getValidToken = async (): Promise<string | null> => {
    if (!user || !tokens) return null

    try {
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) return null

      const response = await supabase.functions.invoke('youtube-refresh-token', {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      })

      if (response.error) {
        console.error('Error refreshing token:', response.error)
        return null
      }

      return response.data.access_token

    } catch (error) {
      console.error('Error getting valid token:', error)
      return null
    }
  }

  return {
    isConnected,
    loading,
    connecting,
    tokens,
    channel: tokens ? {
      id: tokens.channel_id || '',
      name: tokens.channel_name || '',
      thumbnail: tokens.channel_thumbnail || '',
      subscriberCount: tokens.subscriber_count || 0
    } : null,
    startOAuth,
    handleCallback,
    disconnect,
    getValidToken,
    checkConnection
  }
}
