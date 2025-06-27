
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useYouTubeSyncFixed } from '@/hooks/youtube/useYouTubeSyncFixed'
import { useYouTubeAuth } from '@/hooks/useYouTubeAuth'
import { Youtube, Zap, Database, AlertCircle, Infinity, Search, Settings } from 'lucide-react'

interface YouTubeSyncModalFixedProps {
  open: boolean
  onClose: () => void
  onSyncComplete: () => void
}

export function YouTubeSyncModalFixed({ open, onClose, onSyncComplete }: YouTubeSyncModalFixedProps) {
  const { isConnected } = useYouTubeAuth()
  const { syncWithYouTube, syncAllVideos, syncing, syncState } = useYouTubeSyncFixed()
  
  const [syncType, setSyncType] = useState<'quick' | 'full' | 'complete' | 'deep'>('quick')
  const [includeRegular, setIncludeRegular] = useState(true)
  const [includeShorts, setIncludeShorts] = useState(true)
  const [syncMetadata, setSyncMetadata] = useState(true)
  const [maxVideos, setMaxVideos] = useState(50)
  const [maxEmptyPages, setMaxEmptyPages] = useState(5)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSync = async () => {
    try {
      if (syncType === 'complete' || syncType === 'deep') {
        await syncAllVideos({
          type: 'full',
          includeRegular,
          includeShorts,
          syncMetadata,
          maxVideos: 50,
          deepScan: syncType === 'deep',
          maxEmptyPages
        })
      } else {
        await syncWithYouTube({
          type: syncType === 'quick' ? 'incremental' : 'full',
          includeRegular,
          includeShorts,
          syncMetadata,
          maxVideos: syncType === 'quick' ? 50 : maxVideos
        })
      }
      
      onSyncComplete()
    } catch (error) {
      console.error('Sync failed:', error)
    }
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
              Você precisa conectar sua conta do YouTube primeiro para sincronizar os vídeos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Entendi</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Mostrar status do sistema
  if (!syncState.isReady) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              {syncState.isInitializing ? 'Carregando...' : 'Erro no Sistema'}
            </DialogTitle>
            <DialogDescription>
              {syncState.isInitializing 
                ? 'O sistema de sincronização está carregando. Aguarde...'
                : syncState.error || 'Erro desconhecido no sistema'
              }
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
            Configure como você deseja sincronizar seus vídeos do YouTube
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo de Sincronização */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Tipo de Sincronização</Label>
            <div className="grid gap-3">
              {/* Quick Sync */}
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
                    <Badge variant="secondary">Recomendado</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sincroniza até 50 vídeos mais recentes. Ideal para atualizações regulares.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Complete Sync */}
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  syncType === 'complete' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSyncType('complete')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Infinity className="w-4 h-4 text-purple-500" />
                    Sincronização Completa (TODOS OS VÍDEOS)
                    <Badge variant="outline" className="text-purple-600 border-purple-600">Usar Esta</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sincroniza TODOS os vídeos do seu canal (todos os 73 vídeos), parando automaticamente quando não há mais conteúdo novo.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Configurações Básicas */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Tipos de Conteúdo</Label>
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
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={syncing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSync} 
              disabled={syncing || (!includeRegular && !includeShorts)}
              className="flex items-center gap-2"
            >
              <Youtube className="w-4 h-4" />
              {syncing ? 'Sincronizando...' : 
               syncType === 'complete' ? 'Sincronizar TODOS os Vídeos (73)' :
               'Sincronização Rápida (50)'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
