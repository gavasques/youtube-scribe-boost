
import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface GeneralConfig {
  rateLimitEnabled: boolean
  batchProcessing: boolean
  cacheEnabled: boolean
}

interface GeneralApiSettingsProps {
  config: GeneralConfig
  onUpdate: <T extends keyof GeneralConfig>(key: T, value: GeneralConfig[T]) => void
  onResetDefaults: () => void
}

export function GeneralApiSettings({ config, onUpdate, onResetDefaults }: GeneralApiSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurações Gerais
        </CardTitle>
        <CardDescription>
          Configurações globais da aplicação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Rate Limiting</Label>
            <p className="text-sm text-muted-foreground">
              Limitar requisições para evitar sobrecarga
            </p>
          </div>
          <Switch
            checked={config.rateLimitEnabled}
            onCheckedChange={(checked) => onUpdate("rateLimitEnabled", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Processamento em Lote</Label>
            <p className="text-sm text-muted-foreground">
              Processar múltiplos vídeos simultaneamente
            </p>
          </div>
          <Switch
            checked={config.batchProcessing}
            onCheckedChange={(checked) => onUpdate("batchProcessing", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Cache Inteligente</Label>
            <p className="text-sm text-muted-foreground">
              Cache resultados de IA para economia de recursos
            </p>
          </div>
          <Switch
            checked={config.cacheEnabled}
            onCheckedChange={(checked) => onUpdate("cacheEnabled", checked)}
          />
        </div>

        <Separator />

        <div className="pt-2">
          <Button 
            variant="outline"
            onClick={onResetDefaults}
          >
            Restaurar Configurações Padrão
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
