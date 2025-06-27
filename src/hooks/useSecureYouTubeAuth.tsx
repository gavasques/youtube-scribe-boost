
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { securityManager } from '@/utils/encryption'
import { useAuditLog } from '@/hooks/useAuditLog'
import CryptoJS from 'crypto-js'

interface PKCEChallenge {
  codeVerifier: string
  codeChallenge: string
  state: string
  csrfToken: string
  timestamp: number
}

export function useSecureYouTubeAuth() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { logEvent } = useAuditLog()
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  const generatePKCEChallenge = (): PKCEChallenge => {
    const codeVerifier = CryptoJS.lib.WordArray.random(128/8).toString(CryptoJS.enc.Base64url)
    const codeChallenge = CryptoJS.SHA256(codeVerifier).toString(CryptoJS.enc.Base64url)
    const state = CryptoJS.lib.WordArray.random(128/8).toString()
    const csrfToken = securityManager.generateCSRFToken()
    
    return {
      codeVerifier,
      codeChallenge,
      state,
      csrfToken,
      timestamp: Date.now()
    }
  }

  const startSecureOAuth = async () => {
    if (!user) {
      await logEvent({
        event_type: 'AUTH_FAILURE',
        description: 'OAuth attempt without authentication',
        severity: 'HIGH'
      })
      
      toast({
        title: "Erro de Segurança",
        description: "Você precisa estar logado para conectar ao YouTube",
        variant: "destructive"
      })
      return
    }

    setConnecting(true)

    try {
      const pkce = generatePKCEChallenge()
      
      // Store PKCE data securely
      sessionStorage.setItem('youtube_oauth_pkce', JSON.stringify({
        ...pkce,
        userId: user.id
      }))

      await logEvent({
        event_type: 'AUTH_FAILURE',
        description: 'YouTube OAuth initiated with PKCE',
        severity: 'LOW',
        metadata: { userId: user.id }
      })

      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('No active session')
      }

      const response = await supabase.functions.invoke('youtube-oauth-start', {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
          'X-CSRF-Token': pkce.csrfToken
        },
        body: {
          codeChallenge: pkce.codeChallenge,
          state: pkce.state
        }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      window.location.href = response.data.authUrl

    } catch (error) {
      const sanitizedError = securityManager.sanitizeErrorMessage(error)
      
      await logEvent({
        event_type: 'AUTH_FAILURE',
        description: `YouTube OAuth failed: ${sanitizedError}`,
        severity: 'HIGH'
      })

      toast({
        title: "Erro na autenticação",
        description: "Não foi possível iniciar a conexão segura com o YouTube",
        variant: "destructive"
      })
      setConnecting(false)
    }
  }

  const handleSecureCallback = async (code: string, state: string, error?: string) => {
    setConnecting(true)

    try {
      if (error) {
        throw new Error(`OAuth error: ${error}`)
      }

      // Retrieve and validate PKCE data
      const storedPKCE = sessionStorage.getItem('youtube_oauth_pkce')
      if (!storedPKCE) {
        throw new Error('PKCE verification failed - no stored challenge')
      }

      const pkceData: PKCEChallenge & { userId: string } = JSON.parse(storedPKCE)
      
      // Validate state and timestamp
      if (state !== pkceData.state) {
        throw new Error('Invalid state parameter')
      }

      // Check for replay attacks (5 minute window)
      if (Date.now() - pkceData.timestamp > 300000) {
        throw new Error('OAuth session expired')
      }

      await logEvent({
        event_type: 'AUTH_FAILURE',
        description: 'YouTube OAuth callback received',
        severity: 'LOW',
        metadata: { userId: pkceData.userId }
      })

      const response = await supabase.functions.invoke('youtube-oauth-callback', {
        body: { 
          code, 
          state, 
          codeVerifier: pkceData.codeVerifier,
          csrfToken: pkceData.csrfToken
        }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      // Clean up PKCE data
      sessionStorage.removeItem('youtube_oauth_pkce')

      await logEvent({
        event_type: 'AUTH_FAILURE',
        description: 'YouTube OAuth completed successfully',
        severity: 'LOW',
        metadata: { 
          userId: pkceData.userId,
          channelName: response.data.channel.name 
        }
      })

      toast({
        title: "Conectado com segurança!",
        description: `Canal ${response.data.channel.name} conectado`,
      })

    } catch (error) {
      const sanitizedError = securityManager.sanitizeErrorMessage(error)
      
      await logEvent({
        event_type: 'AUTH_FAILURE',
        description: `YouTube OAuth callback failed: ${sanitizedError}`,
        severity: 'HIGH'
      })

      // Clean up on error
      sessionStorage.removeItem('youtube_oauth_pkce')

      toast({
        title: "Erro na autenticação",
        description: "Não foi possível completar a conexão segura com o YouTube",
        variant: "destructive"
      })
    } finally {
      setConnecting(false)
    }
  }

  return {
    loading,
    connecting,
    startSecureOAuth,
    handleSecureCallback
  }
}
