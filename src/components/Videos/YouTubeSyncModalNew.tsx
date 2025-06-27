
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useYouTubeSyncManager } from '@/hooks/youtube/useYouTubeSyncManager'
import { useYouTubeAuth } from '@/hooks/useYouTubeAuth'
import { Youtube, Zap, Infinity, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface YouTubeSyncModalProps {
  open: boolean
  onClose: () => void
  onSyncComplete: () => void
}

export function YouTubeSyncModalNew({ open, onClose, onSyncComplete }: YouTubeSyncModalProps) {
  const { isConnected, channel, startOAuth } = useYouTubeAuth()
  const { syncWithYouTube, syncAllVideos, syncing, syncState } = useYouTubeSyncManager()
  
  const [syncType, setSyncType] = useState<'quick' | 'complete'>('complete')
  const [includeRegular, setIncludeRegular] = useState(true)
  const [includeShorts, setIncludeShorts] = useState(true)
  const [syncMetadata, setSyncMetadata] = useState(true)

  const handleSync = async () => {
    try {
      console.log('[SYNC-MODAL] Iniciando sincronização:', { syncType, includeRegular, includeShorts })
      
      if (syncType === 'complete') {
        await syncAllVideos({
          type: 'full',
          includeRegular,
          includeShorts,
          syncMetadata,
          maxVideos: 50,
          deepScan: true,
          maxEmptyPages: 15 // Aumentar para garantir todos os vídeos
        })
      } else {
        await syncWithYouTube({
          type: 'incremental',
          includeRegular,
          includeShorts,
          syncMetadata,
          maxVideos: 50
        })
      }
      
      onSyncComplete()
    } catch (error) {
      console.error('[SYNC-MODAL] Erro na sincronização:', error)
    }
  }

  const getConnectionStatus = () => {
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

    if (!syncState.hasYouTubeConnection) {
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
          <strong>YouTube conectado!</strong> Canal: {channel?.name}
        </AlertDescription>
      </Alert>
    )
  }

  if (!isConnected) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              YouTube não conectado
            </DialogTitle>
            <DialogDescription>
              Conecte sua conta do YouTube para sincronizar os vídeos.
            </DialogDescription>
          </DialogHeader>
          
          {getConnectionStatus()}
          
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={startOAuth} className="bg-red-600 hover:bg-red-700">
              <Youtube className="w-4 h-4 mr-2" />
              Conectar YouTube
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (syncState.isInitializing) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              Carregando Sistema...
            </DialogTitle>
            <DialogDescription>
              O sistema de sincronização está inicializando. Aguarde...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (syncState.error) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              Erro no Sistema
            </DialogTitle>
            <DialogDescription>
              {syncState.error}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            Sincronizar com YouTube
          </DialogTitle>
          <DialogDescription>
            Configure como sincronizar seus vídeos do YouTube
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {getConnectionStatus()}

          <div className="space-y-4">
            <Label className="text-base font-medium">Tipo de Sincronização</Label>
            <div className="grid gap-3">
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  syncType === 'quick' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSyncType('quick')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-blue-500" />
                    Sincronização Rápida
                    <Badge variant="secondary">50 vídeos</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sincroniza até 50 vídeos mais recentes.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  syncType === 'complete' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSyncType('complete')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Infinity className="w-4 h-4 text-purple-500" />
                    Sincronização Completa - TODOS OS VÍDEOS
                    <Badge variant="outline" className="text-purple-600 border-purple-600">Recomendado</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sincroniza TODOS os vídeos do canal (~73 vídeos) usando varredura profunda.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Configurações</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Vídeos Regulares</Label>
                  <p className="text-sm text-muted-foreground">Vídeos com mais de 60 segundos</p>
                </div>
                <Switch
                  checked={includeRegular}
                  onCheckedChange={setIncludeRegular}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>YouTube Shorts</Label>
                  <p className="text-sm text-muted-foreground">Vídeos com 60 segundos ou menos</p>
                </div>
                <Switch
                  checked={includeShorts}
                  onCheckedChange={setIncludeShorts}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sincronizar Metadados</Label>
                  <p className="text-sm text-muted-foreground">Views, likes, comentários, thumbnails</p>
                </div>
                <Switch
                  checked={syncMetadata}
                  onCheckedChange={setSyncMetadata}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={syncing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSync} 
              disabled={syncing || (!includeRegular && !includeShorts) || !syncState.hasYouTubeConnection}
              className="flex items-center gap-2"
            >
              <Youtube className="w-4 h-4" />
              {syncing ? 'Sincronizando...' : 
               syncType === 'complete' ? 'Sincronizar TODOS os Vídeos' :
               'Sincronização Rápida'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
