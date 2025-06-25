
import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Youtube, CheckCircle, AlertCircle } from "lucide-react"
import { useYouTubeAuth } from "@/hooks/useYouTubeAuth"

export function YouTubeSettings() {
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
      await disconnect()
      setTimeout(() => {
        startOAuth()
      }, 1000)
    } else {
      startOAuth()
    }
  }

  return (
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
  )
}
