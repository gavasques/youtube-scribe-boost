import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Pause, Play, Square, Youtube, Zap, Clock, Shield } from 'lucide-react'

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
  quotaInfo?: {
    exceeded: boolean
    resetTime?: string
    requestsUsed?: number
    dailyLimit?: number
  }
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
}

interface SyncProgressModalProps {
  open: boolean
  onClose: () => void
  progress: SyncProgress | null
  batchSync: BatchSyncState
  onPause: () => void
  onResume: () => void
  onStop: () => void
  rateLimitInfo?: {
    isLimited: boolean
    remainingRequests: number
    remainingTime: number
    currentCount: number
  }
}

export function SyncProgressModal({
  open,
  onClose,
  progress,
  batchSync,
  onPause,
  onResume,
  onStop,
  rateLimitInfo
}: SyncProgressModalProps) {
  if (!progress) return null

  const isComplete = progress.step === 'complete'
  const isError = progress.step === 'error'
  const isPaused = progress.step === 'paused'
  const isQuotaError = progress.quotaInfo?.exceeded
  const isRateLimited = rateLimitInfo?.isLimited

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0
    return (progress.current / progress.total) * 100
  }

  const getStatusBadge = () => {
    if (isError) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          {isQuotaError ? 'Quota Excedida' : 'Erro'}
        </Badge>
      )
    }
    
    if (isPaused) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Pause className="w-3 h-3" />
          Pausado
        </Badge>
      )
    }
    
    if (isComplete) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 gap-1">
          <CheckCircle className="w-3 h-3" />
          Concluído
        </Badge>
      )
    }
    
    return (
      <Badge variant="secondary" className="gap-1">
        <Youtube className="w-3 h-3 animate-spin" />
        Sincronizando
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              Sincronização YouTube
            </span>
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            {progress.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progresso</span>
              <span>{getProgressPercentage().toFixed(0)}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>

          {/* Batch Progress for complete sync */}
          {batchSync.isRunning && progress.totalPages && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Páginas processadas</span>
                <span>{progress.currentPage} de {progress.totalPages}</span>
              </div>
              <Progress 
                value={((progress.currentPage || 1) / progress.totalPages) * 100} 
                className="h-2" 
              />
            </div>
          )}

          {/* Videos processed info */}
          {progress.videosProcessed !== undefined && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-700">
                  {batchSync.isRunning ? batchSync.totalStats.processed : progress.videosProcessed}
                </div>
                <div className="text-xs text-blue-600">Processados</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-700">
                  {batchSync.isRunning ? batchSync.totalStats.new : (progress.videosProcessed || 0)}
                </div>
                <div className="text-xs text-green-600">Novos</div>
              </div>
            </div>
          )}

          {/* Quota Information */}
          {progress.quotaInfo && (
            <div className={`p-3 rounded-lg border ${isQuotaError ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className={`w-4 h-4 ${isQuotaError ? 'text-red-500' : 'text-yellow-500'}`} />
                <span className="font-medium text-sm">
                  {isQuotaError ? 'Quota Excedida' : 'Status da Quota'}
                </span>
              </div>
              
              {progress.quotaInfo.requestsUsed && progress.quotaInfo.dailyLimit && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Requests usados:</span>
                    <span>{progress.quotaInfo.requestsUsed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Limite diário:</span>
                    <span>{progress.quotaInfo.dailyLimit.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={(progress.quotaInfo.requestsUsed / progress.quotaInfo.dailyLimit) * 100}
                    className="h-1 mt-2"
                  />
                </div>
              )}
              
              {isQuotaError && progress.quotaInfo.resetTime && (
                <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                  <Clock className="w-3 h-3" />
                  Reset: {progress.quotaInfo.resetTime}
                </div>
              )}
            </div>
          )}

          {/* Error messages */}
          {progress.errors && progress.errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="font-medium text-sm text-red-800">Erros encontrados:</span>
              </div>
              <div className="space-y-1">
                {progress.errors.slice(0, 3).map((error, index) => (
                  <p key={index} className="text-xs text-red-700">{error}</p>
                ))}
                {progress.errors.length > 3 && (
                  <p className="text-xs text-red-600">... e mais {progress.errors.length - 3} erros</p>
                )}
              </div>
            </div>
          )}

          {/* Control buttons */}
          <div className="flex justify-between pt-4">
            {batchSync.canPause && !isComplete && !isError && (
              <div className="flex gap-2">
                {isPaused ? (
                  <Button onClick={onResume} size="sm" variant="outline" disabled={isRateLimited}>
                    <Play className="w-4 h-4 mr-1" />
                    Retomar
                  </Button>
                ) : (
                  <Button onClick={onPause} size="sm" variant="outline">
                    <Pause className="w-4 h-4 mr-1" />
                    Pausar
                  </Button>
                )}
                <Button onClick={onStop} size="sm" variant="destructive">
                  <Square className="w-4 h-4 mr-1" />
                  Parar
                </Button>
              </div>
            )}
            
            <div className="ml-auto">
              {(isComplete || isError) && (
                <Button onClick={onClose} size="sm">
                  {isQuotaError || isRateLimited ? 'Entendi' : 'Fechar'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
