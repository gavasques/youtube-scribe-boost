import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useYouTubeSyncManager } from '@/hooks/youtube/useYouTubeSyncManager'
import { useYouTubeAuth } from '@/hooks/useYouTubeAuth'
import { Youtube } from 'lucide-react'
import { SyncConnectionStatus } from './Sync/SyncConnectionStatus'
import { SyncProgressDisplay } from './Sync/SyncProgressDisplay'
import { SyncTypeSelector } from './Sync/SyncTypeSelector'

interface YouTubeSyncModalProps {
  open: boolean
  onClose: () => void
  onSyncComplete: () => void
}

export function YouTubeSyncModalNew({ open, onClose, onSyncComplete }: YouTubeSyncModalProps) {
  const { isConnected, channel, startOAuth } = useYouTubeAuth()
  const { syncWithYouTube, syncAllVideos, syncing, progress, syncState, abortSync } = useYouTubeSyncManager()
  
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
      // Não fechar o modal em caso de erro para mostrar o status
    }
  }

  const handleAbort = () => {
    abortSync()
  }

  // Se está sincronizando, mostrar o progresso detalhado
  if (syncing) {
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
            <SyncConnectionStatus 
              isConnected={isConnected}
              hasYouTubeConnection={syncState.hasYouTubeConnection}
              channelName={channel?.name}
            />

            <SyncProgressDisplay 
              progress={progress}
              syncing={syncing}
              onAbort={handleAbort}
            />
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
          
          <SyncConnectionStatus 
            isConnected={isConnected}
            hasYouTubeConnection={syncState.hasYouTubeConnection}
            channelName={channel?.name}
          />
          
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
          <SyncConnectionStatus 
            isConnected={isConnected}
            hasYouTubeConnection={syncState.hasYouTubeConnection}
            channelName={channel?.name}
          />

          <SyncTypeSelector 
            syncType={syncType}
            onSyncTypeChange={setSyncType}
          />

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
