
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
  Square,
  Shield
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
}

interface RateLimitInfo {
  isLimited: boolean
  remainingRequests: number
  remainingTime: number
  currentCount: number
}

interface SyncProgressCardProps {
  progress: SyncProgress | null
  syncing: boolean
  batchSync: BatchSyncState
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
  rateLimitInfo?: RateLimitInfo
}

export function SyncProgressCard({ 
  progress, 
  syncing, 
  batchSync,
  onPause,
  onResume,
  onStop,
  rateLimitInfo
}: SyncProgressCardProps) {
  if (!progress && !syncing && !batchSync.isRunning) return null

  const getProgressPercentage = () => {
    if (!progress) return 0
    if (progress.videosProcessed && progress.totalVideosEstimated) {
      return Math.round((progress.videosProcessed / progress.totalVideosEstimated) * 100)
    }
    return Math.round((progress.current / progress.total) * 100)
  }

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'starting':
      case 'auth':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Video className="w-4 h-4 text-gray-500" />
    }
  }

  const getStepStatus = (step: string) => {
    switch (step) {
      case 'starting':
        return 'Iniciando'
      case 'auth':
        return 'Autenticando'
      case 'syncing':
        return batchSync.isRunning ? 'Sincronização Completa' : 'Sincronizando'
      case 'paused':
        return 'Pausado'
      case 'complete':
        return 'Concluído'
      case 'error':
        return 'Erro'
      default:
        return 'Em andamento'
    }
  }

  const isBatchSync = batchSync.isRunning || (progress?.totalVideosEstimated && progress.totalVideosEstimated > 50)
  const isRateLimited = rateLimitInfo?.isLimited

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            {progress && getStepIcon(progress.step)}
            {isBatchSync ? 'Sincronização Completa' : 'Progresso da Sincronização'}
            <Badge variant={progress?.step === 'complete' ? 'default' : 'secondary'}>
              {progress ? getStepStatus(progress.step) : 'Preparando'}
            </Badge>
          </div>
          
          {batchSync.canPause && (
            <div className="flex gap-2">
              {batchSync.isPaused ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResume}
                  disabled={isRateLimited}
                  className="flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  Continuar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPause}
                  className="flex items-center gap-1"
                >
                  <Pause className="w-3 h-3" />
                  Pausar
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={onStop}
                className="flex items-center gap-1"
              >
                <Square className="w-3 h-3" />
                Parar
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rate Limit Status */}
        {rateLimitInfo && (
          <div className={`p-3 rounded-lg border ${
            isRateLimited ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className={`w-4 h-4 ${isRateLimited ? 'text-yellow-500' : 'text-green-500'}`} />
              <span className="font-medium text-sm">
                {isRateLimited ? 'Rate Limit Ativo' : 'Rate Limit OK'}
              </span>
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Requisições restantes:</span>
                <span className="font-medium">{rateLimitInfo.remainingRequests}</span>
              </div>
              <div className="flex justify-between">
                <span>Requisições usadas:</span>
                <span className="font-medium">{rateLimitInfo.currentCount}</span>
              </div>
              {isRateLimited && (
                <div className="flex justify-between">
                  <span>Reset em:</span>
                  <span className="font-medium">{Math.ceil(rateLimitInfo.remainingTime / 1000)}s</span>
                </div>
              )}
            </div>
            
            {!isRateLimited && (
              <Progress 
                value={(rateLimitInfo.currentCount / (rateLimitInfo.currentCount + rateLimitInfo.remainingRequests)) * 100}
                className="h-1 mt-2"
              />
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {progress?.message || 'Preparando sincronização...'}
            </span>
            <span className="text-sm text-muted-foreground">
              {isBatchSync && progress?.videosProcessed && progress?.totalVideosEstimated ? (
                `${progress.videosProcessed}/${progress.totalVideosEstimated} vídeos`
              ) : progress ? (
                `${progress.current}/${progress.total}`
              ) : (
                '0/5'
              )}
            </span>
          </div>
          <Progress 
            value={getProgressPercentage()} 
            className="w-full h-2"
          />
        </div>

        {/* Página atual para sincronização completa */}
        {isBatchSync && progress?.currentPage && (
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              Página {progress.currentPage}{progress.totalPages ? ` de ${progress.totalPages}` : ''}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {getProgressPercentage()}% concluído
            </div>
          </div>
        )}

        {/* Estatísticas da sincronização completa */}
        {batchSync.isRunning && batchSync.totalStats.processed > 0 && (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-blue-50 p-2 rounded">
              <div className="text-lg font-bold text-blue-600">{batchSync.totalStats.processed}</div>
              <div className="text-xs text-blue-600">Processados</div>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <div className="text-lg font-bold text-green-600">{batchSync.totalStats.new}</div>
              <div className="text-xs text-green-600">Novos</div>
            </div>
            <div className="bg-orange-50 p-2 rounded">
              <div className="text-lg font-bold text-orange-600">{batchSync.totalStats.updated}</div>
              <div className="text-xs text-orange-600">Atualizados</div>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <div className="text-lg font-bold text-red-600">{batchSync.totalStats.errors}</div>
              <div className="text-xs text-red-600">Erros</div>
            </div>
          </div>
        )}

        {/* Progresso normal */}
        {!isBatchSync && progress && (
          <div className="text-center text-sm text-muted-foreground">
            {getProgressPercentage()}% concluído
          </div>
        )}

        {/* Erros */}
        {((progress?.errors && progress.errors.length > 0) || (batchSync.allErrors.length > 0)) && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-1">
                <div className="font-medium">
                  {batchSync.allErrors.length > 0 ? 
                    `${batchSync.allErrors.length} erros encontrados:` :
                    'Erros encontrados:'
                  }
                </div>
                {(batchSync.allErrors.length > 0 ? batchSync.allErrors : progress?.errors || [])
                  .slice(0, 3)
                  .map((error, index) => (
                    <div key={index} className="text-xs">
                      • {error}
                    </div>
                  ))
                }
                {(batchSync.allErrors.length > 3 || (progress?.errors && progress.errors.length > 3)) && (
                  <div className="text-xs font-medium">
                    e mais {(batchSync.allErrors.length || progress?.errors?.length || 0) - 3} erros...
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
