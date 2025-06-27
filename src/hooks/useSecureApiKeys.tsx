
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { securityManager } from '@/utils/encryption'
import { useAuditLog } from './useAuditLog'

interface ApiKey {
  id: string
  service: string
  encrypted_key: string
  is_active: boolean
  last_validated_at: string | null
  validation_status: string | null
  created_at: string
  updated_at: string
}

export function useSecureApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { logEvent } = useAuditLog()

  const fetchApiKeys = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('service')

      if (error) throw error
      setApiKeys(data || [])
    } catch (error) {
      const sanitizedError = securityManager.sanitizeErrorMessage(error)
      console.error('Error fetching API keys:', sanitizedError)
    } finally {
      setLoading(false)
    }
  }

  const saveApiKey = async (service: string, apiKey: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      // Use enhanced encryption
      const encryptedKey = securityManager.encryptApiKey(apiKey)

      const { error } = await supabase
        .from('api_keys')
        .upsert({
          user_id: user.id,
          service,
          encrypted_key: encryptedKey,
          is_active: true,
          validation_status: 'pending'
        }, {
          onConflict: 'user_id,service'
        })

      if (error) throw error

      await logEvent({
        event_type: 'DATA_EXPORT',
        description: `API key saved for service: ${service}`,
        severity: 'MEDIUM',
        metadata: { service, userId: user.id }
      })

      await fetchApiKeys()
      return { success: true }
    } catch (error) {
      const sanitizedError = securityManager.sanitizeErrorMessage(error)
      
      await logEvent({
        event_type: 'AUTH_FAILURE',
        description: `Failed to save API key for ${service}: ${sanitizedError}`,
        severity: 'HIGH',
        metadata: { service, userId: user.id }
      })

      return { success: false, error: sanitizedError }
    }
  }

  const deleteApiKey = async (service: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('service', service)

      if (error) throw error

      await logEvent({
        event_type: 'DATA_DELETION',
        description: `API key deleted for service: ${service}`,
        severity: 'MEDIUM',
        metadata: { service, userId: user.id }
      })

      await fetchApiKeys()
      return { success: true }
    } catch (error) {
      const sanitizedError = securityManager.sanitizeErrorMessage(error)
      
      await logEvent({
        event_type: 'AUTH_FAILURE',
        description: `Failed to delete API key for ${service}: ${sanitizedError}`,
        severity: 'HIGH',
        metadata: { service, userId: user.id }
      })

      return { success: false, error: sanitizedError }
    }
  }

  const getApiKey = (service: string): ApiKey | undefined => {
    return apiKeys.find(key => key.service === service)
  }

  const decryptApiKey = (encryptedKey: string): string => {
    try {
      return securityManager.decryptApiKey(encryptedKey)
    } catch (error) {
      console.error('Failed to decrypt API key:', error)
      return ''
    }
  }

  const validateApiKey = async (service: string): Promise<boolean> => {
    const apiKey = getApiKey(service)
    if (!apiKey) return false

    try {
      const decryptedKey = decryptApiKey(apiKey.encrypted_key)
      
      // Basic validation based on service
      switch (service) {
        case 'openai':
          return decryptedKey.startsWith('sk-') && decryptedKey.length > 20
        case 'bitly':
          return decryptedKey.length > 10
        default:
          return decryptedKey.length > 0
      }
    } catch (error) {
      return false
    }
  }

  useEffect(() => {
    fetchApiKeys()
  }, [user])

  return {
    apiKeys,
    loading,
    saveApiKey,
    deleteApiKey,
    getApiKey,
    decryptApiKey,
    validateApiKey,
    refreshApiKeys: fetchApiKeys
  }
}
