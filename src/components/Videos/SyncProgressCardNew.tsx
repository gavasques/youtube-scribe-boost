
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Youtube, Pause, Play, Square, Clock, Zap } from 'lucide-react'
import type { SyncProgress } from '@/hooks/youtube/useSyncState'

interface BatchSyncState {
  isRunning: boolean
  canPause: boolean
  isPaused: boolean
  totalStats: { processed: number; new: number; updated: number; errors: number }
  allErrors: string[]
  pagesProcessed: number
  emptyPages: number
  maxEmptyPages: number
  startTime?: number
}

interface SyncProgressCardProps {
  progress: SyncProgress
  syncing: boolean
  batchSync: BatchSyncState
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

export function SyncProgressCardNew({ 
  progress, 
  syncing, 
  batchSync, 
  onPause, 
  onResume, 
  onStop 
}: SyncProgressCardProps) {
  if (!syncing && !batchSync.isRunning) {
    return null
  }

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0
  const elapsedTime = batchSync.startTime ? Math.floor((Date.now() - batchSync.startTime) / 1000) : 0
  const formattedTime = `${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60).toString().padStart(2, '0')}`

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800">Sincronização em Andamento</span>
            {batchSync.isPaused && (
              <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">
                Pausado
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {batchSync.canPause && (
              <>
                {batchSync.isPaused ? (
                  <Button size="sm" variant="outline" onClick={onResume}>
                    <Play className="w-3 h-3 mr-1" />
                    Retomar
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={onPause}>
                    <Pause className="w-3 h-3 mr-1" />
                    Pausar
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={onStop}>
                  <Square className="w-3 h-3 mr-1" />
                  Parar
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">{progress.message}</span>
            <div className="flex items-center gap-2 text-blue-600">
              <Clock className="w-3 h-3" />
              <span>{formattedTime}</span>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-blue-600">
            <span>
              {progress.current} de {progress.total || '?'} 
              {progress.step === 'syncing' && ` (Página ${progress.current})`}
            </span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
        </div>

        {batchSync.isRunning && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-lg font-semibold text-green-600">
                {batchSync.totalStats.new}
              </div>
              <div className="text-xs text-green-700">Novos</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-blue-600">
                {batchSync.totalStats.updated}
              </div>
              <div className="text-xs text-blue-700">Atualizados</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-purple-600">
                {batchSync.totalStats.processed}
              </div>
              <div className="text-xs text-purple-700">Processados</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-gray-600">
                {batchSync.pagesProcessed}
              </div>
              <div className="text-xs text-gray-700">Páginas</div>
            </div>
          </div>
        )}

        {progress.processingSpeed && (
          <div className="flex items-center justify-center gap-4 text-sm text-blue-700 bg-blue-100 rounded-lg p-2">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>{progress.processingSpeed.videosPerMinute.toFixed(1)} vídeos/min</span>
            </div>
            {progress.processingSpeed.eta && (
              <div>
                ETA: {new Date(progress.processingSpeed.eta).toLocaleTimeString('pt-BR')}
              </div>
            )}
          </div>
        )}

        {batchSync.allErrors.length > 0 && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong>Erros encontrados:</strong>
            <div className="mt-1 max-h-20 overflow-y-auto">
              {batchSync.allErrors.slice(0, 3).map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
              {batchSync.allErrors.length > 3 && (
                <div>• ... e mais {batchSync.allErrors.length - 3} erros</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
