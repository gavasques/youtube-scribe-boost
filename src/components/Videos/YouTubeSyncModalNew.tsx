
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useYouTubeSyncManager } from '@/hooks/youtube/useYouTubeSyncManager'
import { useYouTubeAuth } from '@/hooks/useYouTubeAuth'
import { Youtube, RefreshCw, Download, AlertCircle, CheckCircle, XCircle, Loader2, Zap, Clock } from 'lucide-react'

interface YouTubeSyncModalProps {
  open: boolean
  onClose: () => void
  onSyncComplete: () => void
}

export function YouTubeSyncModalNew({ open, onClose, onSyncComplete }: YouTubeSyncModalProps) {
  const { isConnected, channel, startOAuth } = useYouTubeAuth()
  const { syncWithYouTube, syncAllVideos, syncing, progress, syncState } = useYouTubeSyncManager()
  
  const [syncType, setSyncType] = useState<'complete' | 'incremental'>('incremental')

  const handleSync = async () => {
    try {
      console.log('[SYNC-MODAL] Iniciando sincronização:', { syncType })
      
      if (syncType === 'complete') {
        await syncAllVideos({
          type: 'full',
          includeRegular: true,
          includeShorts: true,
          syncMetadata: true,
          deepScan: true,
          maxEmptyPages: 15,
          maxVideos: 100
        })
      } else {
        await syncWithYouTube({
          type: 'incremental',
          includeRegular: true,
          includeShorts: true,
          syncMetadata: true,
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

  // Se está sincronizando, mostrar o progresso detalhado
  if (syncing) {
    const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0
    
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
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
            {getConnectionStatus()}

            {/* Progresso Principal */}
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
            </div>

            {/* Estatísticas em Tempo Real */}
            {progress.pageStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {progress.pageStats.newInPage || 0}
                  </div>
                  <div className="text-xs text-green-700">Novos nesta página</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {progress.pageStats.updatedInPage || 0}
                  </div>
                  <div className="text-xs text-blue-700">Atualizados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {progress.pageStats.videosInPage || 0}
                  </div>
                  <div className="text-xs text-purple-700">Vídeos na página</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {progress.totalVideosEstimated || 0}
                  </div>
                  <div className="text-xs text-gray-700">Total estimado</div>
                </div>
              </div>
            )}

            {/* Velocidade de Processamento */}
            {progress.processingSpeed && (
              <div className="flex items-center justify-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {progress.processingSpeed.videosPerMinute.toFixed(1)} vídeos/min
                  </span>
                </div>
                {progress.processingSpeed.eta && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      ETA: {new Date(progress.processingSpeed.eta).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" disabled>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sincronizando...
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Modal de conexão necessária
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

  // Estados de carregamento/erro
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

  // Modal principal - APENAS 2 OPÇÕES SIMPLES
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            Sincronizar com YouTube
          </DialogTitle>
          <DialogDescription>
            Escolha como você deseja sincronizar seus vídeos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {getConnectionStatus()}

          {/* APENAS 2 OPÇÕES SIMPLES */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Tipo de Sincronização</Label>
            <div className="grid gap-3">
              
              {/* Opção 1: Sincronização Incremental (Padrão/Recomendada) */}
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  syncType === 'incremental' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSyncType('incremental')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                    Sincronização Rápida
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">Recomendado</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sincroniza até 50 vídeos mais recentes. Ideal para atualizações regulares.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Opção 2: Sincronização Completa */}
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  syncType === 'complete' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSyncType('complete')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4 text-purple-500" />
                    Varredura Profunda
                    <Badge variant="outline" className="text-purple-600 border-purple-600">Completo</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sincroniza TODOS os vídeos do canal. Ideal para primeira configuração.
                  </CardDescription>
                </CardHeader>
              </Card>

            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={syncing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSync} 
              disabled={syncing || !syncState.hasYouTubeConnection}
              className="flex items-center gap-2"
            >
              <Youtube className="w-4 h-4" />
              {syncing ? 'Sincronizando...' : 
               syncType === 'complete' ? 'Iniciar Varredura Profunda' :
               'Iniciar Sincronização Rápida'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
