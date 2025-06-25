
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

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

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

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
      console.error('Error fetching API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveApiKey = async (service: string, apiKey: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      // Simple encryption (in production, use proper encryption)
      const encryptedKey = btoa(apiKey)

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

      // Refresh the list after saving
      await fetchApiKeys()
      return { success: true }
    } catch (error) {
      console.error('Error saving API key:', error)
      return { success: false, error: (error as Error).message }
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

      await fetchApiKeys()
      return { success: true }
    } catch (error) {
      console.error('Error deleting API key:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  const getApiKey = (service: string): ApiKey | undefined => {
    return apiKeys.find(key => key.service === service)
  }

  const decryptApiKey = (encryptedKey: string): string => {
    try {
      return atob(encryptedKey)
    } catch {
      return ''
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
    refreshApiKeys: fetchApiKeys
  }
}
