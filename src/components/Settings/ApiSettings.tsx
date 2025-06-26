
import React from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { OpenAISettings } from "./OpenAISettings"
import { BitlySettings } from "./BitlySettings"
import { YouTubeSettings } from "./YouTubeSettings"

interface ApiConfig {
  openai: {
    enabled: boolean
    model: string
    temperature: number
    maxTokens: number
    status: 'connected' | 'disconnected' | 'error'
  }
  bitly: {
    enabled: boolean
    customDomain: string
    status: 'connected' | 'disconnected' | 'error'
  }
}

export function ApiSettings() {
  const [config, setConfig] = useLocalStorage<ApiConfig>("apiConfig", {
    openai: {
      enabled: true,
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 2000,
      status: 'disconnected'
    },
    bitly: {
      enabled: false,
      customDomain: "",
      status: 'disconnected'
    }
  })

  const updateOpenAIConfig = <T extends keyof ApiConfig['openai']>(
    key: T,
    value: ApiConfig['openai'][T]
  ) => {
    console.log('ApiSettings: Updating OpenAI config:', key, value)
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
    console.log('ApiSettings: Updating Bitly config:', key, value)
    setConfig(prev => ({
      ...prev,
      bitly: {
        ...prev.bitly,
        [key]: value
      }
    }))
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
    </div>
  )
}
