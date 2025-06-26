
import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react"
import { useApiKeys } from "@/hooks/useApiKeys"
import { showSuccessToast, showErrorToast } from "@/components/ui/enhanced-toast"
import { validateForm, apiKeySchema, openaiApiKeySchema } from "@/utils/settingsValidation"
import { API_SERVICES } from "@/utils/settingsConstants"

interface SecureApiKeyModalProps {
  service: string
  children: React.ReactNode
  onStatusChange?: (status: 'connected' | 'disconnected' | 'error') => void
}

const SERVICE_CONFIGS = {
  [API_SERVICES.OPENAI]: {
    validation: openaiApiKeySchema,
    placeholder: "Insira sua API key do OpenAI",
    instructions: [
      "• A API key deve começar com 'sk-'",
      "• Você pode obter sua chave em: platform.openai.com/api-keys",
      "• A chave será criptografada e salva com segurança"
    ]
  },
  [API_SERVICES.BITLY]: {
    validation: apiKeySchema,
    placeholder: "Insira sua API key do Bitly",
    instructions: [
      "• Obtenha sua chave em: bitly.com/a/oauth_apps",
      "• A chave será criptografada e salva com segurança"
    ]
  }
}

export function SecureApiKeyModal({ service, children, onStatusChange }: SecureApiKeyModalProps) {
  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const { saveApiKey, deleteApiKey, getApiKey, decryptApiKey } = useApiKeys()

  const existingKey = getApiKey(service.toLowerCase())
  const hasExistingKey = !!existingKey
  const config = SERVICE_CONFIGS[service.toLowerCase() as keyof typeof SERVICE_CONFIGS]

  const handleSave = async () => {
    const validation = validateForm(config?.validation || apiKeySchema, apiKey)
    if (!validation.success) {
      const firstError = Object.values(validation.errors).flat().find(error => typeof error === 'string')
      showErrorToast({
        title: "Erro",
        description: firstError || "API key inválida"
      })
      return
    }

    setSaving(true)
    try {
      const result = await saveApiKey(service.toLowerCase(), apiKey)
      
      if (result.success) {
        showSuccessToast({
          title: "Sucesso!",
          description: `API key do ${service} salva com segurança no banco de dados`
        })
        setOpen(false)
        setApiKey("")
        onStatusChange?.('connected')
      } else {
        showErrorToast({
          title: "Erro ao salvar",
          description: result.error || "Erro desconhecido"
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    setSaving(true)
    try {
      const result = await deleteApiKey(service.toLowerCase())
      
      if (result.success) {
        showSuccessToast({
          title: "Removido",
          description: `API key do ${service} removida do banco de dados`
        })
        setOpen(false)
        setApiKey("")
        onStatusChange?.('disconnected')
      } else {
        showErrorToast({
          title: "Erro ao remover",
          description: result.error || "Erro desconhecido"
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && hasExistingKey) {
      setApiKey(decryptApiKey(existingKey.encrypted_key))
    } else if (!isOpen) {
      setApiKey("")
      setShowKey(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configurar API Key - {service}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {hasExistingKey && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                API key configurada e salva no banco de dados
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="apikey">API Key</Label>
            <div className="relative">
              <Input
                id="apikey"
                type={showKey ? "text" : "password"}
                placeholder={config?.placeholder || "Insira sua API key"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
                disabled={saving}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
                disabled={saving}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {config?.instructions && (
            <div className="text-sm text-muted-foreground space-y-1">
              {config.instructions.map((instruction, index) => (
                <p key={index}>{instruction}</p>
              ))}
            </div>
          )}

          <div className="flex justify-between gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={!hasExistingKey || saving}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Remover
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar Seguro
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
