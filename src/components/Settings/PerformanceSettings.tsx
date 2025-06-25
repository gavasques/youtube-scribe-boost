
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Trash2, RotateCcw } from "lucide-react"

interface PerformanceSettings {
  autoSync: boolean
  cacheEnabled: boolean
  batchSize: number
  lazyLoading: boolean
  prefetchData: boolean
}

export function PerformanceSettings() {
  const [settings, setSettings] = useLocalStorage<PerformanceSettings>("performanceSettings", {
    autoSync: false,
    cacheEnabled: true,
    batchSize: 50,
    lazyLoading: true,
    prefetchData: true
  })

  const updateSetting = <K extends keyof PerformanceSettings>(
    key: K, 
    value: PerformanceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const clearCache = () => {
    // Clear localStorage cache items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_') || key.startsWith('query_')) {
        localStorage.removeItem(key)
      }
    })
    
    // Reload page to refresh
    window.location.reload()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance</CardTitle>
        <CardDescription>
          Otimize a performance da aplicação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Sincronização Automática</Label>
            <p className="text-sm text-muted-foreground">
              Sincronizar automaticamente com YouTube a cada 30 minutos
            </p>
          </div>
          <Switch
            checked={settings.autoSync}
            onCheckedChange={(checked) => updateSetting("autoSync", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Cache Local</Label>
            <p className="text-sm text-muted-foreground">
              Armazenar dados localmente para carregamento mais rápido
            </p>
          </div>
          <Switch
            checked={settings.cacheEnabled}
            onCheckedChange={(checked) => updateSetting("cacheEnabled", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Carregamento Lazy</Label>
            <p className="text-sm text-muted-foreground">
              Carregar componentes apenas quando necessário
            </p>
          </div>
          <Switch
            checked={settings.lazyLoading}
            onCheckedChange={(checked) => updateSetting("lazyLoading", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Pré-carregar Dados</Label>
            <p className="text-sm text-muted-foreground">
              Carregar dados antecipadamente para melhor experiência
            </p>
          </div>
          <Switch
            checked={settings.prefetchData}
            onCheckedChange={(checked) => updateSetting("prefetchData", checked)}
          />
        </div>

        <div className="space-y-2">
          <Label>Tamanho do Lote</Label>
          <Select 
            value={settings.batchSize.toString()} 
            onValueChange={(value) => updateSetting("batchSize", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 itens</SelectItem>
              <SelectItem value="50">50 itens</SelectItem>
              <SelectItem value="100">100 itens</SelectItem>
              <SelectItem value="200">200 itens</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Número de itens carregados por vez nas listagens
          </p>
        </div>

        <div className="pt-4 border-t space-y-2">
          <h4 className="font-medium">Limpeza</h4>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={clearCache}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Cache
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                setSettings({
                  autoSync: false,
                  cacheEnabled: true,
                  batchSize: 50,
                  lazyLoading: true,
                  prefetchData: true
                })
              }}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Padrões
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
