
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useYouTubeSyncManager } from '@/hooks/youtube/useYouTubeSyncManager'
import { useYouTubeAuth } from '@/hooks/useYouTubeAuth'
import { Youtube, RefreshCw, Download, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface YouTubeSyncModalProps {
  open: boolean
  onClose: () => void
  onSyncComplete: () => void
}

export function YouTubeSyncModalNew({ open, onClose, onSyncComplete }: YouTubeSyncModalProps) {
  const { isConnected, channel, startOAuth } = useYouTubeAuth()
  const { syncWithYouTube, syncAllVideos, syncing, progress, syncState } = useYouTubeSyncManager()
  
  const [syncType, setSyncType] = useState<'complete' | 'incremental'>('incremental')
  const [includeRegular, setIncludeRegular] = useState(true)
  const [includeShorts, setIncludeShorts] = useState(true)
  const [syncMetadata, setSyncMetadata] = useState(true)

  const handleSync = async () => {
    try {
      console.log('[SYNC-MODAL] Iniciando sincronização:', { syncType, includeRegular, includeShorts })
      
      if (syncType === 'complete') {
        // Sincronização Completa - TODOS os vídeos
        await syncAllVideos({
          type: 'full',
          includeRegular,
          includeShorts,
          syncMetadata,
          deepScan: true,
          maxEmptyPages: 15,
          maxVideos: 100
        })
      } else {
        // Sincronização Incremental - apenas vídeos novos
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

  // Se está sincronizando, mostrar o progresso
  if (syncing) {
    const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0
    
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              Sincronizando com YouTube
            </DialogTitle>
            <DialogDescription>
              {syncType === 'complete' ? 'Sincronização Completa em andamento...' : 'Sincronização Incremental em andamento...'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status da Conexão */}
            {getConnectionStatus()}

            {/* Progresso da Sincronização */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Progresso da Sincronização</Label>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-600">Sincronizando...</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{progress.message}</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Página {progress.current} de {progress.total || '?'}</span>
                  <span>Etapa: {progress.step}</span>
                </div>
              </div>

              {/* Estatísticas em tempo real */}
              {progress.pageStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {progress.pageStats.newInPage || 0}
                    </div>
                    <div className="text-xs text-green-700">Novos nesta página</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {progress.pageStats.updatedInPage || 0}
                    </div>
                    <div className="text-xs text-blue-700">Atualizados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {progress.pageStats.videosInPage || 0}
                    </div>
                    <div className="text-xs text-purple-700">Total na página</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-600">
                      {progress.totalVideosEstimated || 0}
                    </div>
                    <div className="text-xs text-gray-700">Total estimado</div>
                  </div>
                </div>
              )}

              {/* Velocidade de processamento */}
              {progress.processingSpeed && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-700">
                    Velocidade: {progress.processingSpeed.videosPerMinute.toFixed(1)} vídeos/min
                    {progress.processingSpeed.eta && (
                      <span className="ml-2">
                        | ETA: {new Date(progress.processingSpeed.eta).toLocaleTimeString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botão para fechar (desabilitado durante sync) */}
            <div className="flex justify-end">
              <Button variant="outline" disabled>
                Sincronizando...
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
            Escolha o tipo de sincronização que você deseja executar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {getConnectionStatus()}

          <div className="space-y-4">
            <Label className="text-base font-medium">Tipo de Sincronização</Label>
            <div className="grid gap-3">
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  syncType === 'complete' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSyncType('complete')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4 text-purple-500" />
                    Sincronização Completa
                    <Badge variant="outline" className="text-purple-600 border-purple-600">Primeira Vez</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sincroniza TODOS os vídeos do canal (~73 vídeos). 
                    Ideal para primeira sincronização ou carga completa.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  syncType === 'incremental' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSyncType('incremental')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                    Sincronização Incremental
                    <Badge variant="secondary">Apenas Novos</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sincroniza apenas os vídeos novos desde a última sincronização. 
                    Rápido e ideal para uso regular.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Configurações de Conteúdo</Label>
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
               syncType === 'complete' ? 'Sincronização Completa' :
               'Sincronização Incremental'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
