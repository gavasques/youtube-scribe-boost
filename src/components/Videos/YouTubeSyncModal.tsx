
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useYouTubeAuth } from '@/hooks/useYouTubeAuth'
import { 
  Youtube, 
  RefreshCw, 
  Settings, 
  CheckCircle, 
  XCircle,
  Clock,
  Video,
  Zap,
  AlertTriangle
} from 'lucide-react'

interface SyncOptions {
  type: 'full' | 'incremental'
  includeRegular: boolean
  includeShorts: boolean
  syncMetadata: boolean
  maxVideos: number
}

interface SyncStats {
  processed: number
  new: number
  updated: number
  errors: number
}

interface SyncProgress {
  step: string
  current: number
  total: number
  message: string
  errors?: string[]
}

interface YouTubeSyncModalProps {
  open: boolean
  onClose: () => void
  onSyncComplete: () => void
}

export function YouTubeSyncModal({ open, onClose, onSyncComplete }: YouTubeSyncModalProps) {
  const { toast } = useToast()
  const { isConnected, connecting, startOAuth } = useYouTubeAuth()
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [showConfig, setShowConfig] = useState(true)

  const [options, setOptions] = useState<SyncOptions>({
    type: 'incremental',
    includeRegular: true,
    includeShorts: true,
    syncMetadata: true,
    maxVideos: 50
  })

  const handleSync = async () => {
    // Verificar conexão antes de iniciar
    if (!isConnected) {
      toast({
        title: 'YouTube não conectado',
        description: 'Conecte sua conta do YouTube antes de sincronizar',
        variant: 'destructive'
      })
      return
    }

    setSyncing(true)
    setShowConfig(false)
    setProgress(null)
    setStats(null)
    setErrors([])

    try {
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('Não autenticado')
      }

      const response = await supabase.functions.invoke('youtube-sync', {
        body: { options },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      setStats(response.data.stats)
      if (response.data.errors) {
        setErrors(response.data.errors)
      }

      toast({
        title: 'Sincronização concluída!',
        description: `${response.data.stats.processed} vídeos processados. ${response.data.stats.new} novos, ${response.data.stats.updated} atualizados.`,
      })

      onSyncComplete()

    } catch (error) {
      console.error('Erro na sincronização:', error)
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar com o YouTube',
        variant: 'destructive'
      })
      setErrors([error.message])
    } finally {
      setSyncing(false)
    }
  }

  const handleClose = () => {
    if (!syncing) {
      onClose()
      // Reset state after a delay to avoid flicker
      setTimeout(() => {
        setShowConfig(true)
        setProgress(null)
        setStats(null)
        setErrors([])
      }, 300)
    }
  }

  const getProgressPercentage = () => {
    if (!progress) return 0
    return Math.round((progress.current / progress.total) * 100)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            Sincronizar com YouTube
          </DialogTitle>
          <DialogDescription>
            Sincronize seus vídeos do YouTube com o banco local
          </DialogDescription>
        </DialogHeader>

        {/* Verificação de Conexão */}
        {!isConnected && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <span>Você precisa conectar sua conta do YouTube primeiro.</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={startOAuth}
                  disabled={connecting}
                  className="ml-2"
                >
                  {connecting ? 'Conectando...' : 'Conectar YouTube'}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {showConfig && !syncing && isConnected && (
          <div className="space-y-6">
            {/* Tipo de Sincronização */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Tipo de Sincronização</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="incremental"
                    checked={options.type === 'incremental'}
                    onChange={() => setOptions(prev => ({ ...prev, type: 'incremental' }))}
                  />
                  <Label htmlFor="incremental" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Incremental
                    </div>
                    <p className="text-xs text-muted-foreground">Apenas novos vídeos</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="full"
                    checked={options.type === 'full'}
                    onChange={() => setOptions(prev => ({ ...prev, type: 'full' }))}
                  />
                  <Label htmlFor="full" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Completa
                    </div>
                    <p className="text-xs text-muted-foreground">Todos os vídeos</p>
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Opções de Conteúdo */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Tipos de Vídeo</Label>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <Label htmlFor="regular">Vídeos Normais</Label>
                </div>
                <Switch
                  id="regular"
                  checked={options.includeRegular}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeRegular: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <Label htmlFor="shorts">YouTube Shorts</Label>
                </div>
                <Switch
                  id="shorts"
                  checked={options.includeShorts}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeShorts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <Label htmlFor="metadata">Sincronizar Metadados</Label>
                </div>
                <Switch
                  id="metadata"
                  checked={options.syncMetadata}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, syncMetadata: checked }))
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Limite de Vídeos */}
            <div className="space-y-2">
              <Label htmlFor="maxVideos">Máximo de Vídeos</Label>
              <Input
                id="maxVideos"
                type="number"
                min="1"
                max="500"
                value={options.maxVideos}
                onChange={(e) => 
                  setOptions(prev => ({ ...prev, maxVideos: parseInt(e.target.value) || 50 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Limite de vídeos para processar (máximo: 500)
              </p>
            </div>
          </div>
        )}

        {/* Progress */}
        {syncing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {progress?.message || 'Iniciando sincronização...'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {progress ? `${progress.current}/${progress.total}` : '0/5'}
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
            </div>

            {progress && (
              <div className="text-center text-sm text-muted-foreground">
                {getProgressPercentage()}% concluído
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {stats && !syncing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Processados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.processed}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Novos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                    Atualizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.updated}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Erros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                </CardContent>
              </Card>
            </div>

            {errors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-red-600">Erros Encontrados:</Label>
                <ScrollArea className="h-24 w-full border rounded-md p-2">
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600">
                        {error}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          {showConfig && !syncing && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSync}
                disabled={syncing || !isConnected || (!options.includeRegular && !options.includeShorts)}
                className="gap-2"
              >
                <Youtube className="w-4 h-4" />
                Iniciar Sincronização
              </Button>
            </>
          )}
          
          {syncing && (
            <Button variant="outline" disabled>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Sincronizando...
            </Button>
          )}

          {stats && !syncing && (
            <Button onClick={handleClose}>
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
