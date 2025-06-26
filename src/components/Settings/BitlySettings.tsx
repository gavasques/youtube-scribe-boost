
import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Key, Link, CheckCircle, AlertCircle } from "lucide-react"
import { useApiKeys } from "@/hooks/useApiKeys"
import { SecureApiKeyModal } from "./SecureApiKeyModal"

interface BitlyConfig {
  enabled: boolean
  customDomain: string
  status: 'connected' | 'disconnected' | 'error'
}

interface BitlySettingsProps {
  config: BitlyConfig
  onUpdate: <T extends keyof BitlyConfig>(key: T, value: BitlyConfig[T]) => void
}

export function BitlySettings({ config, onUpdate }: BitlySettingsProps) {
  const { getApiKey, decryptApiKey } = useApiKeys()
  const apiKey = getApiKey('bitly')
  
  // Update status based on database state with proper validation
  React.useEffect(() => {
    console.log('BitlySettings: Checking API key status...', { apiKey: !!apiKey })
    
    let newStatus: 'connected' | 'disconnected' | 'error' = 'disconnected'
    
    if (apiKey) {
      // Decrypt and validate the API key
      const decryptedKey = decryptApiKey(apiKey.encrypted_key)
      console.log('BitlySettings: Decrypted key exists:', !!decryptedKey)
      
      if (decryptedKey && decryptedKey.trim().length > 0) {
        newStatus = 'connected'
      } else {
        newStatus = 'error'
      }
    }
    
    console.log('BitlySettings: Setting status to:', newStatus)
    
    if (config.status !== newStatus) {
      onUpdate('status', newStatus)
    }
  }, [apiKey, config.status, onUpdate, decryptApiKey])

  const handleStatusChange = (status: 'connected' | 'disconnected' | 'error') => {
    console.log('BitlySettings: Manual status change to:', status)
    onUpdate('status', status)
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
          <Link className="w-5 h-5" />
          Bitly Configuration
        </CardTitle>
        <div className="flex items-center justify-between">
          <CardDescription>
            Configure URL shortening with Bitly
          </CardDescription>
          {getStatusBadge(config.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Habilitar Bitly</Label>
            <p className="text-sm text-muted-foreground">
              Encurtar URLs automaticamente nas descrições
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => onUpdate("enabled", checked)}
          />
        </div>

        <div className="space-y-2">
          <Label>Domínio Personalizado (Opcional)</Label>
          <Input
            placeholder="seu-dominio.com"
            value={config.customDomain}
            onChange={(e) => onUpdate("customDomain", e.target.value)}
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
      </CardContent>
    </Card>
  )
}
