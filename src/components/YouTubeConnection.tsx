
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Youtube, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Loader2
} from "lucide-react"
import { useYouTubeAuth } from '@/hooks/useYouTubeAuth'

export default function YouTubeConnection() {
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

  const getConnectionStatus = () => {
    if (loading) {
      return <Badge variant="secondary" className="gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Verificando...
      </Badge>
    }
    
    if (isConnected) {
      return <Badge variant="default" className="bg-green-100 text-green-800 gap-1">
        <CheckCircle className="w-3 h-3" />
        Conectado
      </Badge>
    }
    
    return <Badge variant="destructive" className="gap-1">
      <XCircle className="w-3 h-3" />
      Desconectado
    </Badge>
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          Conectar ao YouTube
        </CardTitle>
        <CardDescription>
          Configure a conexão com sua conta do YouTube
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Status da Conexão</p>
            <p className="text-sm text-muted-foreground">
              {isConnected && channel ? `Conectado como: ${channel.name}` : "Não conectado"}
            </p>
          </div>
          {getConnectionStatus()}
        </div>
        
        {isConnected && channel && (
          <>
            <div className="space-y-2">
              <Label htmlFor="youtube-channel">Canal Conectado</Label>
              <Input 
                id="youtube-channel"
                value={channel.name}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {channel.subscriberCount > 0 && (
                  <>Inscritos: {formatNumber(channel.subscriberCount)} • </>
                )}
                {tokens && `Última sincronização: ${formatDate(tokens.updated_at)}`}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Permissões Concedidas</Label>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Ler informações do canal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Gerenciar vídeos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Atualizar descrições</span>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={startOAuth}
              disabled={connecting || loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Youtube className="w-4 h-4 mr-2" />
                  Conectar com YouTube
                </>
              )}
            </Button>
          ) : (
            <>
              <Button 
                onClick={disconnect}
                variant="destructive"
              >
                <Youtube className="w-4 h-4 mr-2" />
                Desconectar
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={checkConnection}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4" />
                Sincronizar Agora
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
