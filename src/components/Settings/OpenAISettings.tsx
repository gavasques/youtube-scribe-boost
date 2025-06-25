

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Key, Zap, CheckCircle, AlertCircle, Search, Settings } from "lucide-react"
import { useApiKeys } from "@/hooks/useApiKeys"
import { useOpenAIModels } from "@/hooks/useOpenAIModels"
import { useModelPreferences } from "@/hooks/useModelPreferences"
import { SecureApiKeyModal } from "./SecureApiKeyModal"
import { OpenAIModelsModal } from "./OpenAIModelsModal"

interface OpenAIConfig {
  enabled: boolean
  model: string
  temperature: number
  maxTokens: number
  status: 'connected' | 'disconnected' | 'error'
}

interface OpenAISettingsProps {
  config: OpenAIConfig
  onUpdate: <T extends keyof OpenAIConfig>(key: T, value: OpenAIConfig[T]) => void
}

// Modelos de fallback apenas quando não há API key
const fallbackModels = [
  { id: "gpt-4o", name: "GPT-4o (Recomendado)" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { id: "o1-preview", name: "O1 Preview" },
  { id: "o1-mini", name: "O1 Mini" }
]

export function OpenAISettings({ config, onUpdate }: OpenAISettingsProps) {
  const { getApiKey } = useApiKeys()
  const { models } = useOpenAIModels()
  const { getEnabledModels, getEnabledCount } = useModelPreferences()
  const apiKey = getApiKey('openai')
  
  // Update status based on database state
  React.useEffect(() => {
    const newStatus = apiKey ? 'connected' : 'disconnected'
    if (config.status !== newStatus) {
      onUpdate('status', newStatus)
    }
  }, [apiKey, config.status, onUpdate])

  const handleStatusChange = (status: 'connected' | 'disconnected' | 'error') => {
    onUpdate('status', status)
  }

  const handleModelSelect = (modelId: string) => {
    onUpdate('model', modelId)
  }

  // Get enabled models for the dropdown
  const enabledApiModels = getEnabledModels(models)
  const enabledCount = getEnabledCount(models)
  const hasApiModels = models.length > 0
  const hasEnabledModels = enabledApiModels.length > 0

  // Debug logs para investigar o problema
  console.log('🔍 OpenAI Settings Debug:', {
    apiKey: !!apiKey,
    modelsCount: models.length,
    enabledApiModels,
    enabledCount,
    hasApiModels,
    hasEnabledModels
  })

  // Determine available models based on context:
  // Se não há API key: usar fallback
  // Se há API key E há modelos da API E há modelos habilitados: usar modelos habilitados
  // Caso contrário: array vazio
  const availableModels = !apiKey 
    ? fallbackModels
    : (hasApiModels && hasEnabledModels)
      ? enabledApiModels.map(model => ({ id: model.id, name: model.id }))
      : []

  console.log('🎯 Available models for dropdown:', availableModels)

  const getStatusBadge = (status: 'connected' | 'disconnected' | 'error') => {
    const variants = {
      connected: { variant: "default" as const, icon: CheckCircle, text: "Conectado" },
      disconnected: { variant: "secondary" as const, icon: AlertCircle, text: "Desconectado" },
      error: { variant: "destructive" as const, icon: AlertCircle, text: "Erro" }
    }
    
    const { variant, icon: Icon, text } = variants[status]
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    )
  }

  // Condição para mostrar o aviso (só quando há API key, há modelos carregados, mas nenhum habilitado)
  const shouldShowEnableModelsWarning = apiKey && hasApiModels && !hasEnabledModels

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          OpenAI Configuration
        </CardTitle>
        <div className="flex items-center justify-between">
          <CardDescription>
            Configure OpenAI API settings for AI processing
          </CardDescription>
          {getStatusBadge(config.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Habilitar OpenAI</Label>
            <p className="text-sm text-muted-foreground">
              Ativar processamento com inteligência artificial
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => onUpdate("enabled", checked)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Modelo</Label>
              {hasApiModels && (
                <Badge variant="outline" className="text-xs">
                  {enabledCount} de {models.length} habilitados
                </Badge>
              )}
            </div>
            {apiKey && (
              <OpenAIModelsModal 
                onModelSelect={handleModelSelect}
                currentModel={config.model}
              >
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Gerenciar Modelos
                </Button>
              </OpenAIModelsModal>
            )}
          </div>
          
          <Select 
            value={config.model} 
            onValueChange={(value) => onUpdate("model", value)}
            disabled={shouldShowEnableModelsWarning}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                shouldShowEnableModelsWarning
                  ? "Selecione modelos primeiro" 
                  : "Selecione um modelo"
              } />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name || model.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {!apiKey && (
            <p className="text-xs text-muted-foreground">
              Configure sua API key para gerenciar modelos personalizados
            </p>
          )}
          
          {shouldShowEnableModelsWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ Nenhum modelo está selecionado. Clique em "Gerenciar Modelos" para escolher quais modelos devem aparecer neste dropdown.
              </p>
            </div>
          )}

          {/* Debug info temporário */}
          {apiKey && hasApiModels && hasEnabledModels && availableModels.length === 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                🐛 DEBUG: Modelos habilitados detectados mas lista vazia. Verifique o console para mais detalhes.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Temperature (0-1)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => onUpdate("temperature", parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Max Tokens</Label>
            <Input
              type="number"
              min="100"
              max="4000"
              value={config.maxTokens}
              onChange={(e) => onUpdate("maxTokens", parseInt(e.target.value))}
            />
          </div>
        </div>

        <SecureApiKeyModal
          service="OpenAI"
          onStatusChange={handleStatusChange}
        >
          <Button variant="outline" className="w-full">
            <Key className="w-4 h-4 mr-2" />
            {apiKey ? 'Atualizar API Key' : 'Configurar API Key'}
          </Button>
        </SecureApiKeyModal>
      </CardContent>
    </Card>
  )
}

