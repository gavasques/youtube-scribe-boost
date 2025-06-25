
import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Key, Eye, EyeOff } from "lucide-react"

interface ApiKeyModalProps {
  service: string
  currentKey?: string
  onSave: (key: string) => void
  children: React.ReactNode
}

export function ApiKeyModal({ service, currentKey, onSave, children }: ApiKeyModalProps) {
  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState(currentKey || "")
  const [showKey, setShowKey] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma API key válida",
        variant: "destructive"
      })
      return
    }

    // Basic validation for OpenAI keys
    if (service === "OpenAI" && !apiKey.startsWith("sk-")) {
      toast({
        title: "Erro",
        description: "API key do OpenAI deve começar com 'sk-'",
        variant: "destructive"
      })
      return
    }

    onSave(apiKey)
    setOpen(false)
    toast({
      title: "Sucesso",
      description: `API key do ${service} configurada com sucesso!`
    })
  }

  const handleClear = () => {
    setApiKey("")
    onSave("")
    setOpen(false)
    toast({
      title: "Removido",
      description: `API key do ${service} removida`
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="space-y-2">
            <Label htmlFor="apikey">API Key</Label>
            <div className="relative">
              <Input
                id="apikey"
                type={showKey ? "text" : "password"}
                placeholder={`Insira sua API key do ${service}`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {service === "OpenAI" && (
            <div className="text-sm text-muted-foreground">
              <p>• A API key deve começar com "sk-"</p>
              <p>• Você pode obter sua chave em: platform.openai.com/api-keys</p>
            </div>
          )}

          {service === "Bitly" && (
            <div className="text-sm text-muted-foreground">
              <p>• Obtenha sua chave em: bitly.com/a/oauth_apps</p>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={!currentKey}
            >
              Remover
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
