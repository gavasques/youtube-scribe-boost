
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Key, Zap, Search } from "lucide-react"
import { useApiKeys } from "@/hooks/useApiKeys"
import { useApiConfig } from "@/hooks/useApiConfig"
import { SecureApiKeyModal } from "../Common/SecureApiKeyModal"
import { OpenAIModelsModal } from "../OpenAIModelsModal"
import { SettingsCard } from "../Common/SettingsCard"
import { API_SERVICES } from "@/utils/settingsConstants"

export function OpenAIServiceCard() {
  const { getApiKey } = useApiKeys()
  const { config, updateConfig } = useApiConfig()
  const apiKey = getApiKey(API_SERVICES.OPENAI)
  
  const handleStatusChange = (status: 'connected' | 'disconnected' | 'error') => {
    updateConfig('openai', { status })
  }

  return (
    <SettingsCard
      title="OpenAI Configuration"
      description="Configure OpenAI API settings for AI processing"
      icon={Zap}
      status={config.openai.status}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Habilitar OpenAI</Label>
          <p className="text-sm text-muted-foreground">
            Ativar processamento com inteligência artificial
          </p>
        </div>
        <Switch
          checked={config.openai.enabled}
          onCheckedChange={(checked) => updateConfig('openai', { enabled: checked })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Modelo</Label>
          {apiKey && (
            <OpenAIModelsModal>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Ver Modelos
              </Button>
            </OpenAIModelsModal>
          )}
        </div>
        
        <Input
          type="text"
          placeholder="Ex: gpt-4o, gpt-4o-mini, gpt-3.5-turbo..."
          value={config.openai.model}
          onChange={(e) => updateConfig('openai', { model: e.target.value })}
        />
        
        <p className="text-xs text-muted-foreground">
          Digite o nome do modelo OpenAI que deseja usar. Use o botão "Ver Modelos" para consultar os modelos disponíveis.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Temperature (0-1)</Label>
          <Input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={config.openai.temperature}
            onChange={(e) => updateConfig('openai', { temperature: parseFloat(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max Tokens</Label>
          <Input
            type="number"
            min="100"
            max="4000"
            value={config.openai.maxTokens}
            onChange={(e) => updateConfig('openai', { maxTokens: parseInt(e.target.value) })}
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
    </SettingsCard>
  )
}
