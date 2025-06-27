
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useYouTubeSync } from '@/hooks/useYouTubeSync'
import { useYouTubeAuth } from '@/hooks/useYouTubeAuth'
import { Youtube, Zap, Database, AlertCircle, Infinity } from 'lucide-react'

interface YouTubeSyncModalProps {
  open: boolean
  onClose: () => void
  onSyncComplete: () => void
}

export function YouTubeSyncModal({ open, onClose, onSyncComplete }: YouTubeSyncModalProps) {
  const { isConnected } = useYouTubeAuth()
  const { syncWithYouTube, syncAllVideos, syncing } = useYouTubeSync()
  
  const [syncType, setSyncType] = useState<'quick' | 'full' | 'complete'>('quick')
  const [includeRegular, setIncludeRegular] = useState(true)
  const [includeShorts, setIncludeShorts] = useState(true)
  const [syncMetadata, setSyncMetadata] = useState(true)
  const [maxVideos, setMaxVideos] = useState(50)

  const handleSync = async () => {
    try {
      if (syncType === 'complete') {
        await syncAllVideos({
          type: 'full',
          includeRegular,
          includeShorts,
          syncMetadata,
          maxVideos: 50 // Use 50 per page for complete sync
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

              {/* Full Sync */}
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  syncType === 'full' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSyncType('full')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Database className="w-4 h-4 text-orange-500" />
                    Sincronização Personalizada
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Escolha quantos vídeos sincronizar (até 500). Mais controle sobre o processo.
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
                    Sincronização Completa
                    <Badge variant="outline" className="text-purple-600 border-purple-600">Todos os vídeos</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sincroniza TODOS os vídeos do seu canal. Pode levar vários minutos. Ideal para configuração inicial.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Opções Avançadas */}
          {syncType === 'full' && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Configurações</Label>
              <div className="space-y-2">
                <Label htmlFor="maxVideos">Máximo de vídeos (1-500)</Label>
                <Input
                  id="maxVideos"
                  type="number"
                  min="1"
                  max="500"
                  value={maxVideos}
                  onChange={(e) => setMaxVideos(parseInt(e.target.value) || 50)}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Alertas */}
          {syncType === 'complete' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800">Sincronização Completa</div>
                  <div className="text-yellow-700 mt-1">
                    Esta opção pode levar muito tempo se você tiver muitos vídeos. O processo será feito em lotes e você poderá pausar/retomar a qualquer momento.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Atualizar Metadados</Label>
                  <p className="text-sm text-muted-foreground">Views, likes, comentários dos vídeos existentes</p>
                </div>
                <Switch
                  checked={syncMetadata}
                  onCheckedChange={setSyncMetadata}
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
               syncType === 'complete' ? 'Sincronizar Todos' :
               syncType === 'full' ? `Sincronizar ${maxVideos} Vídeos` :
               'Sincronização Rápida'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
