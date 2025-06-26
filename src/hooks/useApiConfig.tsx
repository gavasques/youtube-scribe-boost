
import { useState, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { API_SERVICES, API_STATUS } from '@/utils/settingsConstants'

interface ApiConfigState {
  openai: {
    enabled: boolean
    model: string
    temperature: number
    maxTokens: number
    status: string
  }
  bitly: {
    enabled: boolean
    customDomain: string
    status: string
  }
}

const DEFAULT_CONFIG: ApiConfigState = {
  openai: {
    enabled: true,
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 2000,
    status: API_STATUS.DISCONNECTED
  },
  bitly: {
    enabled: false,
    customDomain: "",
    status: API_STATUS.DISCONNECTED
  }
}

export function useApiConfig() {
  const [config, setConfig] = useLocalStorage<ApiConfigState>("apiConfig", DEFAULT_CONFIG)
  const [loading, setLoading] = useState(false)

  const updateConfig = useCallback(<T extends keyof ApiConfigState>(
    service: T,
    updates: Partial<ApiConfigState[T]>
  ) => {
    console.log(`useApiConfig: Updating ${service} config:`, updates)
    setConfig(prev => ({
      ...prev,
      [service]: {
        ...prev[service],
        ...updates
      }
    }))
  }, [setConfig])

  const resetConfig = useCallback((service: keyof ApiConfigState) => {
    setConfig(prev => ({
      ...prev,
      [service]: DEFAULT_CONFIG[service]
    }))
  }, [setConfig])

  return {
    config,
    loading,
    setLoading,
    updateConfig,
    resetConfig
  }
}
