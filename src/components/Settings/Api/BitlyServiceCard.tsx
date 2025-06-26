
import React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Key, Link } from "lucide-react"
import { useApiKeys } from "@/hooks/useApiKeys"
import { useApiConfig } from "@/hooks/useApiConfig"
import { SecureApiKeyModal } from "../Common/SecureApiKeyModal"
import { SettingsCard } from "../Common/SettingsCard"
import { API_SERVICES } from "@/utils/settingsConstants"

export function BitlyServiceCard() {
  const { getApiKey, decryptApiKey } = useApiKeys()
  const { config, updateConfig } = useApiConfig()
  const apiKey = getApiKey(API_SERVICES.BITLY)
  
  // Update status based on database state
  React.useEffect(() => {
    let newStatus: 'connected' | 'disconnected' | 'error' = 'disconnected'
    
    if (apiKey) {
      const decryptedKey = decryptApiKey(apiKey.encrypted_key)
      if (decryptedKey && decryptedKey.trim().length > 0) {
        newStatus = 'connected'
      } else {
        newStatus = 'error'
      }
    }
    
    if (config.bitly.status !== newStatus) {
      updateConfig('bitly', { status: newStatus })
    }
  }, [apiKey, config.bitly.status, updateConfig, decryptApiKey])

  const handleStatusChange = (status: 'connected' | 'disconnected' | 'error') => {
    updateConfig('bitly', { status })
  }

  return (
    <SettingsCard
      title="Bitly Configuration"
      description="Configure URL shortening with Bitly"
      icon={Link}
      status={config.bitly.status}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Habilitar Bitly</Label>
          <p className="text-sm text-muted-foreground">
            Encurtar URLs automaticamente nas descrições
          </p>
        </div>
        <Switch
          checked={config.bitly.enabled}
          onCheckedChange={(checked) => updateConfig('bitly', { enabled: checked })}
        />
      </div>

      <div className="space-y-2">
        <Label>Domínio Personalizado (Opcional)</Label>
        <Input
          placeholder="seu-dominio.com"
          value={config.bitly.customDomain}
          onChange={(e) => updateConfig('bitly', { customDomain: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Deixe em branco para usar bit.ly padrão
        </p>
      </div>

      <SecureApiKeyModal
        service="Bitly"
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
