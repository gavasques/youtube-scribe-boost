
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, AlertCircle, Youtube, Pause, Play, Square } from 'lucide-react'

interface SyncProgressModalProps {
  open: boolean
  onClose: () => void
  progress: {
    step: string
    current: number
    total: number
    message: string
    errors?: string[]
    currentPage?: number
    totalPages?: number
    videosProcessed?: number
    totalVideosEstimated?: number
  } | null
  batchSync: {
    isRunning: boolean
    canPause: boolean
    isPaused: boolean
    totalStats: {
      processed: number
      new: number
      updated: number
      errors: number
    }
    allErrors: string[]
  }
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export function SyncProgressModal({
  open,
  onClose,
  progress,
  batchSync,
  onPause,
  onResume,
  onStop
}: SyncProgressModalProps) {
  if (!progress) return null

  const getStepIcon = () => {
    switch (progress.step) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'paused':
        return <Pause className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />
    }
  }

  const getStepColor = () => {
    switch (progress.step) {
      case 'complete':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'paused':
        return 'text-yellow-600'
      default:
        return 'text-blue-600'
    }
  }

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            Sincronização YouTube
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status atual */}
          <div className="flex items-center gap-3">
            {getStepIcon()}
            <div className="flex-1">
              <p className={`font-medium ${getStepColor()}`}>
                {progress.message}
              </p>
              {progress.currentPage && progress.totalPages && (
                <p className="text-sm text-muted-foreground">
                  Página {progress.currentPage} de {progress.totalPages}
                </p>
              )}
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progresso: {progress.current}/{progress.total}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
          </div>

          {/* Estatísticas da sincronização */}
          {batchSync.isRunning && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Processados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {batchSync.totalStats.processed}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Novos</p>
                <p className="text-2xl font-bold text-green-600">
                  {batchSync.totalStats.new}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Atualizados</p>
                <p className="text-2xl font-bold text-orange-600">
                  {batchSync.totalStats.updated}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Erros</p>
                <p className="text-2xl font-bold text-red-600">
                  {batchSync.totalStats.errors}
                </p>
              </div>
            </div>
          )}

          {/* Estimativa total de vídeos */}
          {progress.totalVideosEstimated && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Total estimado: {progress.totalVideosEstimated} vídeos
                </span>
              </div>
              {progress.videosProcessed && (
                <p className="text-xs text-blue-700 mt-1">
                  Processados até agora: {progress.videosProcessed}
                </p>
              )}
            </div>
          )}

          {/* Controles de sincronização em lote */}
          {batchSync.isRunning && batchSync.canPause && (
            <div className="flex gap-2">
              {batchSync.isPaused ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResume}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Retomar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPause}
                  className="flex-1"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={onStop}
                className="flex-1"
              >
                <Square className="w-4 h-4 mr-2" />
                Parar
              </Button>
            </div>
          )}

          {/* Erros */}
          {progress.errors && progress.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Erros encontrados ({progress.errors.length})
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {progress.errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-xs text-red-700 p-2 bg-red-50 rounded">
                    {error}
                  </div>
                ))}
                {progress.errors.length > 5 && (
                  <p className="text-xs text-red-600">
                    ... e mais {progress.errors.length - 5} erros
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status badges */}
          <div className="flex items-center justify-center gap-2">
            {progress.step === 'complete' && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Concluído
              </Badge>
            )}
            {progress.step === 'error' && (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                Erro
              </Badge>
            )}
            {progress.step === 'paused' && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                <Pause className="w-3 h-3 mr-1" />
                Pausado
              </Badge>
            )}
          </div>

          {/* Botão de fechar */}
          {(progress.step === 'complete' || progress.step === 'error') && (
            <Button onClick={onClose} className="w-full">
              Fechar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
