
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocalStorage } from "@/hooks/useLocalStorage"

interface NotificationSettings {
  approvals: boolean
  syncComplete: boolean
  aiProcessing: boolean
  errors: boolean
  sound: boolean
  position: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  duration: number
}

export function NotificationSettings() {
  const [settings, setSettings] = useLocalStorage<NotificationSettings>("notificationSettings", {
    approvals: true,
    syncComplete: true,
    aiProcessing: true,
    errors: true,
    sound: false,
    position: "top-right",
    duration: 5000
  })

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K, 
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
        <CardDescription>
          Configure quando e como receber notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium">Tipos de Notificação</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aprovações Pendentes</Label>
              <p className="text-sm text-muted-foreground">
                Notificar sobre novas aprovações pendentes
              </p>
            </div>
            <Switch
              checked={settings.approvals}
              onCheckedChange={(checked) => updateSetting("approvals", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronização Completa</Label>
              <p className="text-sm text-muted-foreground">
                Notificar quando a sincronização com YouTube terminar
              </p>
            </div>
            <Switch
              checked={settings.syncComplete}
              onCheckedChange={(checked) => updateSetting("syncComplete", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Processamento IA</Label>
              <p className="text-sm text-muted-foreground">
                Notificar sobre o status do processamento de IA
              </p>
            </div>
            <Switch
              checked={settings.aiProcessing}
              onCheckedChange={(checked) => updateSetting("aiProcessing", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Erros</Label>
              <p className="text-sm text-muted-foreground">
                Notificar sobre erros e falhas do sistema
              </p>
            </div>
            <Switch
              checked={settings.errors}
              onCheckedChange={(checked) => updateSetting("errors", checked)}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Configurações de Exibição</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Som</Label>
              <p className="text-sm text-muted-foreground">
                Reproduzir som ao receber notificações
              </p>
            </div>
            <Switch
              checked={settings.sound}
              onCheckedChange={(checked) => updateSetting("sound", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Posição</Label>
            <Select 
              value={settings.position} 
              onValueChange={(value: typeof settings.position) => updateSetting("position", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-right">Superior Direita</SelectItem>
                <SelectItem value="top-left">Superior Esquerda</SelectItem>
                <SelectItem value="bottom-right">Inferior Direita</SelectItem>
                <SelectItem value="bottom-left">Inferior Esquerda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duração (segundos)</Label>
            <Select 
              value={settings.duration.toString()} 
              onValueChange={(value) => updateSetting("duration", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3000">3 segundos</SelectItem>
                <SelectItem value="5000">5 segundos</SelectItem>
                <SelectItem value="8000">8 segundos</SelectItem>
                <SelectItem value="0">Permanente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
