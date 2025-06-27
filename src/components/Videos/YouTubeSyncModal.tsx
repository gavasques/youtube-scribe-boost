
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useYouTubeSync } from '@/hooks/youtube/useYouTubeSync'
import { useYouTubeAuth } from '@/hooks/useYouTubeAuth'
import { Youtube, Zap, Database, AlertCircle, Infinity, Search, Settings } from 'lucide-react'

interface YouTubeSyncModalProps {
  open: boolean
  onClose: () => void
  onSyncComplete: () => void
}

export function YouTubeSyncModal({ open, onClose, onSyncComplete }: YouTubeSyncModalProps) {
  const { isConnected } = useYouTubeAuth()
  const { syncWithYouTube, syncAllVideos, syncing } = useYouTubeSync()
  
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
                    <Badge variant="outline" className="text-purple-600 border-purple-600">Inteligente</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sincroniza todos os vídeos novos, parando automaticamente quando não há mais conteúdo novo.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Deep Scan */}
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  syncType === 'deep' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSyncType('deep')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Search className="w-4 h-4 text-red-500" />
                    Varredura Profunda
                    <Badge variant="outline" className="text-red-600 border-red-600">Completo</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sincroniza TODOS os vídeos do canal, independente de serem novos. Ideal para primeira configuração.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Opções Avançadas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="p-0 h-auto font-medium"
              >
                <Settings className="w-4 h-4 mr-1" />
                Configurações Avançadas
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                {syncType === 'full' && (
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
                )}

                {(syncType === 'complete' || syncType === 'deep') && (
                  <div className="space-y-2">
                    <Label htmlFor="maxEmptyPages">Páginas consecutivas sem novos vídeos (1-10)</Label>
                    <Input
                      id="maxEmptyPages"
                      type="number"
                      min="1"
                      max="10"
                      value={maxEmptyPages}
                      onChange={(e) => setMaxEmptyPages(parseInt(e.target.value) || 5)}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      {syncType === 'deep' ? 'Não aplicável na varredura profunda (processa tudo)' : 'Parar após X páginas sem vídeos novos'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alertas */}
          {(syncType === 'complete' || syncType === 'deep') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800">
                    {syncType === 'deep' ? 'Varredura Profunda' : 'Sincronização Completa'}
                  </div>
                  <div className="text-yellow-700 mt-1">
                    {syncType === 'deep' 
                      ? 'Esta opção processará TODOS os vídeos do seu canal, podendo levar muito tempo. Use apenas para configuração inicial.'
                      : 'Esta opção pode levar tempo se você tiver muitos vídeos. O processo será feito em lotes com feedback detalhado.'
                    }
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
               syncType === 'deep' ? 'Varredura Profunda' :
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
