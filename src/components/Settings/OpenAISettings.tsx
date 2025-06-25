
import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Key, Zap, CheckCircle, AlertCircle, Search } from "lucide-react"
import { useApiKeys } from "@/hooks/useApiKeys"
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

// Modelos de fallback caso a API não esteja disponível
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
            <Label>Modelo</Label>
            {apiKey && (
              <OpenAIModelsModal 
                onModelSelect={handleModelSelect}
                currentModel={config.model}
              >
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Modelos
                </Button>
              </OpenAIModelsModal>
            )}
          </div>
          
          <Select 
            value={config.model} 
            onValueChange={(value) => onUpdate("model", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um modelo" />
            </SelectTrigger>
            <SelectContent>
              {fallbackModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {!apiKey && (
            <p className="text-xs text-muted-foreground">
              Configure sua API key para buscar modelos em tempo real
            </p>
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
