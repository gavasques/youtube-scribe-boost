
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Video,
  Pause,
  Play,
  Square
} from 'lucide-react'

interface SyncProgress {
  step: string
  current: number
  total: number
  message: string
  errors?: string[]
  currentPage?: number
  totalPages?: number
  videosProcessed?: number
  totalVideosEstimated?: number
}

interface BatchSyncState {
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
  pagesProcessed: number
  emptyPages: number
  maxEmptyPages: number
}

interface SyncProgressCardProps {
  progress: SyncProgress | null
  syncing: boolean
  batchSync: BatchSyncState
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
}

export function SyncProgressCard({ 
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

  const getProgressPercentage = () => {
    if (progress.total > 0) {
      return Math.round((progress.current / progress.total) * 100)
    }
    return 0
  }

  const formatBatchStats = () => {
    const { totalStats, pagesProcessed = 0, emptyPages = 0 } = batchSync
    return {
      ...totalStats,
      pagesProcessed,
      emptyPages,
      efficiency: pagesProcessed > 0 ? Math.round((totalStats.new / pagesProcessed) * 100) / 100 : 0
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {syncing ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            Progresso da Sincronização
          </div>
          {batchSync.canPause && (
            <div className="flex gap-2 ml-auto">
              {batchSync.isPaused ? (
                <Button variant="outline" size="sm" onClick={onResume}>
                  <Play className="w-4 h-4 mr-1" />
                  Retomar
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={onPause}>
                  <Pause className="w-4 h-4 mr-1" />
                  Pausar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onStop}>
                <Square className="w-4 h-4 mr-1" />
                Parar
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{progress.message}</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <Progress value={getProgressPercentage()} className="w-full" />
        </div>

        {batchSync.isRunning && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatBatchStats().new}
              </div>
              <div className="text-sm text-muted-foreground">Novos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatBatchStats().updated}
              </div>
              <div className="text-sm text-muted-foreground">Atualizados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {formatBatchStats().pagesProcessed}
              </div>
              <div className="text-sm text-muted-foreground">Páginas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatBatchStats().emptyPages}
              </div>
              <div className="text-sm text-muted-foreground">Sem Novos</div>
            </div>
          </div>
        )}

        {batchSync.isPaused && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-800">
              ⏸️ Sincronização pausada. Os dados serão preservados ao retomar.
            </div>
          </div>
        )}

        {formatBatchStats().errors > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-800">
              ⚠️ {formatBatchStats().errors} erro(s) encontrado(s) durante a sincronização.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
