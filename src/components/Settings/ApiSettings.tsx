
import React from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { OpenAISettings } from "./OpenAISettings"
import { BitlySettings } from "./BitlySettings"
import { YouTubeSettings } from "./YouTubeSettings"
import { GeneralApiSettings } from "./GeneralApiSettings"

interface ApiConfig {
  openai: {
    enabled: boolean
    model: string
    temperature: number
    maxTokens: number
    status: 'connected' | 'disconnected' | 'error'
    apiKey?: string
  }
  bitly: {
    enabled: boolean
    customDomain: string
    status: 'connected' | 'disconnected' | 'error'
    apiKey?: string
  }
  general: {
    rateLimitEnabled: boolean
    batchProcessing: boolean
    cacheEnabled: boolean
  }
}

export function ApiSettings() {
  const [config, setConfig] = useLocalStorage<ApiConfig>("apiConfig", {
    openai: {
      enabled: true,
      model: "gpt-4.1-2025-04-14",
      temperature: 0.7,
      maxTokens: 2000,
      status: 'disconnected'
    },
    bitly: {
      enabled: false,
      customDomain: "",
      status: 'disconnected'
    },
    general: {
      rateLimitEnabled: true,
      batchProcessing: true,
      cacheEnabled: true
    }
  })

  const updateOpenAIConfig = <T extends keyof ApiConfig['openai']>(
    key: T,
    value: ApiConfig['openai'][T]
  ) => {
    setConfig(prev => ({
      ...prev,
      openai: {
        ...prev.openai,
        [key]: value
      }
    }))
  }

  const updateBitlyConfig = <T extends keyof ApiConfig['bitly']>(
    key: T,
    value: ApiConfig['bitly'][T]
  ) => {
    setConfig(prev => ({
      ...prev,
      bitly: {
        ...prev.bitly,
        [key]: value
      }
    }))
  }

  const updateGeneralConfig = <T extends keyof ApiConfig['general']>(
    key: T,
    value: ApiConfig['general'][T]
  ) => {
    setConfig(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [key]: value
      }
    }))
  }

  const handleResetDefaults = () => {
    setConfig({
      openai: {
        enabled: true,
        model: "gpt-4.1-2025-04-14",
        temperature: 0.7,
        maxTokens: 2000,
        status: 'disconnected'
      },
      bitly: {
        enabled: false,
        customDomain: "",
        status: 'disconnected'
      },
      general: {
        rateLimitEnabled: true,
        batchProcessing: true,
        cacheEnabled: true
      }
    })
  }

  return (
    <div className="space-y-6">
      <OpenAISettings 
        config={config.openai} 
        onUpdate={updateOpenAIConfig} 
      />
      
      <BitlySettings 
        config={config.bitly} 
        onUpdate={updateBitlyConfig} 
      />
      
      <YouTubeSettings />
      
      <GeneralApiSettings 
        config={config.general} 
        onUpdate={updateGeneralConfig}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  )
}
