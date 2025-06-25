
import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Key, Youtube, Link, Zap, CheckCircle, AlertCircle, Settings } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useYouTubeAuth } from "@/hooks/useYouTubeAuth"

interface ApiConfig {
  openai: {
    enabled: boolean
    model: string
    temperature: number
    maxTokens: number
    status: 'connected' | 'disconnected' | 'error'
  }
  bitly: {
    enabled: boolean
    customDomain: string
    status: 'connected' | 'disconnected' | 'error'
  }
  general: {
    rateLimitEnabled: boolean
    batchProcessing: boolean
    cacheEnabled: boolean
  }
}

export function ApiSettings() {
  // YouTube Auth hook
  const { 
    isConnected, 
    loading, 
    connecting,
    channel,
    tokens,
    startOAuth, 
    disconnect,
    checkConnection 
  } = useYouTubeAuth()

  const [config, setConfig] = useLocalStorage<ApiConfig>("apiConfig", {
    openai: {
      enabled: true,
      model: "gpt-4.1-2025-04-14",
      temperature: 0.7,
      maxTokens: 2000,
      status: 'disconnected'
    },
    bitly: {
      enabled: false,
      customDomain: "",
      status: 'disconnected'
    },
    general: {
      rateLimitEnabled: true,
      batchProcessing: true,
      cacheEnabled: true
    }
  })

  const updateConfig = <K extends keyof ApiConfig, T extends keyof ApiConfig[K]>(
    section: K,
    key: T,
    value: ApiConfig[K][T]
  ) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
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

  const getYouTubeStatusBadge = () => {
    if (loading) {
      return <Badge variant="secondary" className="gap-1">
        <AlertCircle className="w-3 h-3 animate-spin" />
        Verificando...
      </Badge>
    }
    
    if (isConnected && tokens) {
      return <Badge variant="default" className="bg-green-100 text-green-800 gap-1">
        <CheckCircle className="w-3 h-3" />
        Conectado
      </Badge>
    }
    
    return <Badge variant="destructive" className="gap-1">
      <AlertCircle className="w-3 h-3" />
      Desconectado
    </Badge>
  }

  const handleYouTubeReconnect = async () => {
    if (isConnected) {
      // Se já conectado, desconectar primeiro e depois reconectar
      await disconnect()
      setTimeout(() => {
        startOAuth()
      }, 1000)
    } else {
      // Se não conectado, apenas conectar
      startOAuth()
    }
  }

  return (
    <div className="space-y-6">
      {/* OpenAI Configuration */}
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
            {getStatusBadge(config.openai.status)}
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
              checked={config.openai.enabled}
              onCheckedChange={(checked) => updateConfig("openai", "enabled", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Modelo</Label>
            <Select 
              value={config.openai.model} 
              onValueChange={(value) => updateConfig("openai", "model", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 (Recomendado)</SelectItem>
                <SelectItem value="o3-2025-04-16">O3 (Reasoning)</SelectItem>
                <SelectItem value="o4-mini-2025-04-16">O4 Mini (Rápido)</SelectItem>
                <SelectItem value="gpt-4.1-mini-2025-04-14">GPT-4.1 Mini</SelectItem>
              </SelectContent>
            </Select>
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
                onChange={(e) => updateConfig("openai", "temperature", parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                min="100"
                max="4000"
                value={config.openai.maxTokens}
                onChange={(e) => updateConfig("openai", "maxTokens", parseInt(e.target.value))}
              />
            </div>
          </div>

          <Button variant="outline" className="w-full">
            <Key className="w-4 h-4 mr-2" />
            Configurar API Key
          </Button>
        </CardContent>
      </Card>

      {/* Bitly Configuration */}
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
            {getStatusBadge(config.bitly.status)}
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
              checked={config.bitly.enabled}
              onCheckedChange={(checked) => updateConfig("bitly", "enabled", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Domínio Personalizado (Opcional)</Label>
            <Input
              placeholder="seu-dominio.com"
              value={config.bitly.customDomain}
              onChange={(e) => updateConfig("bitly", "customDomain", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar bit.ly padrão
            </p>
          </div>

          <Button variant="outline" className="w-full">
            <Key className="w-4 h-4 mr-2" />
            Configurar API Key
          </Button>
        </CardContent>
      </Card>

      {/* YouTube Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5" />
            YouTube Integration
          </CardTitle>
          <div className="flex items-center justify-between">
            <CardDescription>
              Configure YouTube API settings and synchronization
            </CardDescription>
            {getYouTubeStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected && channel && (
            <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <Label className="text-green-800">Canal Conectado</Label>
              </div>
              <p className="text-sm font-medium text-green-900">{channel.name}</p>
              <p className="text-xs text-green-700">
                {channel.subscriberCount > 0 && (
                  <>Inscritos: {channel.subscriberCount.toLocaleString()} • </>
                )}
                Última sincronização: {tokens ? new Date(tokens.updated_at).toLocaleString('pt-BR') : 'N/A'}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronização Automática</Label>
              <p className="text-sm text-muted-foreground">
                Sincronizar automaticamente com YouTube
              </p>
            </div>
            <Switch
              checked={true}
              disabled={!isConnected}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Intervalo (minutos)</Label>
              <Select 
                value="30"
                disabled={!isConnected}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Vídeos por Sync</Label>
              <Input
                type="number"
                min="10"
                max="500"
                value="100"
                disabled={!isConnected}
              />
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleYouTubeReconnect}
            disabled={connecting || loading}
          >
            <Youtube className="w-4 h-4 mr-2" />
            {connecting ? "Conectando..." : isConnected ? "Reconectar YouTube" : "Conectar YouTube"}
          </Button>

          {isConnected && (
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={disconnect}
              disabled={loading}
            >
              <Youtube className="w-4 h-4 mr-2" />
              Desconectar YouTube
            </Button>
          )}
        </CardContent>
      </Card>

      {/* General App Settings */}
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
              checked={config.general.rateLimitEnabled}
              onCheckedChange={(checked) => updateConfig("general", "rateLimitEnabled", checked)}
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
              checked={config.general.batchProcessing}
              onCheckedChange={(checked) => updateConfig("general", "batchProcessing", checked)}
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
              checked={config.general.cacheEnabled}
              onCheckedChange={(checked) => updateConfig("general", "cacheEnabled", checked)}
            />
          </div>

          <Separator />

          <div className="pt-2">
            <Button 
              variant="outline"
              onClick={() => {
                setConfig({
                  openai: {
                    enabled: true,
                    model: "gpt-4.1-2025-04-14",
                    temperature: 0.7,
                    maxTokens: 2000,
                    status: 'disconnected'
                  },
                  bitly: {
                    enabled: false,
                    customDomain: "",
                    status: 'disconnected'
                  },
                  general: {
                    rateLimitEnabled: true,
                    batchProcessing: true,
                    cacheEnabled: true
                  }
                })
              }}
            >
              Restaurar Configurações Padrão
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
