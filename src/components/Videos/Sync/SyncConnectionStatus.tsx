
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface SyncConnectionStatusProps {
  isConnected: boolean
  hasYouTubeConnection: boolean
  channelName?: string
}

export function SyncConnectionStatus({ isConnected, hasYouTubeConnection, channelName }: SyncConnectionStatusProps) {
  if (!isConnected) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>YouTube não conectado!</strong> Conecte sua conta do YouTube primeiro.
        </AlertDescription>
      </Alert>
    )
  }

  if (!hasYouTubeConnection) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Verificando conexão...</strong> Aguarde a verificação da conexão.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <strong>YouTube conectado!</strong> Canal: {channelName}
      </AlertDescription>
    </Alert>
  )
}
