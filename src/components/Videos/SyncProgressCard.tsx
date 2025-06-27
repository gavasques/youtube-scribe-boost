
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
  Zap,
  TrendingUp,
  Timer
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
  processingSpeed?: {
    videosPerMinute: number
    elapsedTimeMs: number
    eta?: string
  }
  pageStats?: {
    videosInPage: number
    newInPage: number
    updatedInPage: number
    isEmptyPage: boolean
    totalChannelVideos?: number
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
    totalEstimated?: number
  }
  allErrors: string[]
  pagesProcessed: number
  emptyPages: number
  maxEmptyPages: number
  startTime?: number
  lastPageStats?: {
    videosInPage: number
    newInPage: number
    updatedInPage: number
    isEmptyPage: boolean
    totalChannelVideos?: number
  }
  overallSpeed?: {
    videosPerMinute: number
    elapsedTimeMs: number
    eta?: string
  }
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
    if (batchSync.totalStats.totalEstimated && batchSync.totalStats.totalEstimated > 0) {
      return Math.round((batchSync.totalStats.processed / batchSync.totalStats.totalEstimated) * 100)
    }
    if (progress && progress.total > 0) {
      return Math.round((progress.current / progress.total) * 100)
    }
    return 0
  }

  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatETA = (eta?: string) => {
    if (!eta) return 'Calculando...'
    return new Date(eta).toLocaleTimeString('pt-BR')
  }

  const progressPercentage = getProgressPercentage()
  const speed = batchSync.overallSpeed || progress?.processingSpeed
  const totalEstimated = batchSync.totalStats.totalEstimated || batchSync.lastPageStats?.totalChannelVideos || 0
  
  // CORREÇÃO: Detectar se está em modo deep scan
  const isDeepScan = progress?.message?.includes('VARREDURA PROFUNDA') || false

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
            {isDeepScan ? 'Varredura Profunda em Progresso' : 'Progresso da Sincronização'}
            {totalEstimated > 0 && (
              <Badge variant="outline" className="ml-2">
                ~{totalEstimated.toLocaleString()} vídeos no canal
              </Badge>
            )}
            {isDeepScan && (
              <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800">
                Modo Profundo
              </Badge>
            )}
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
            <span>{progress?.message || 'Processando...'}</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        {/* Detailed Statistics */}
        {batchSync.isRunning && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {batchSync.totalStats.new}
              </div>
              <div className="text-sm text-muted-foreground">Novos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {batchSync.totalStats.updated}
              </div>
              <div className="text-sm text-muted-foreground">Atualizados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {batchSync.pagesProcessed}
              </div>
              <div className="text-sm text-muted-foreground">Páginas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {batchSync.emptyPages}
              </div>
              <div className="text-sm text-muted-foreground">Sem Novos</div>
            </div>
          </div>
        )}

        {/* Processing Speed and ETA */}
        {speed && (
          <div className={`border rounded-lg p-3 ${isDeepScan ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${isDeepScan ? 'text-purple-600' : 'text-blue-600'}`} />
                <span className="font-medium">Velocidade:</span>
                <span>{speed.videosPerMinute.toFixed(1)} vídeos/min</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className={`w-4 h-4 ${isDeepScan ? 'text-purple-600' : 'text-blue-600'}`} />
                <span className="font-medium">Tempo decorrido:</span>
                <span>{formatElapsedTime(speed.elapsedTimeMs)}</span>
              </div>
              {speed.eta && (
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isDeepScan ? 'text-purple-600' : 'text-blue-600'}`} />
                  <span className="font-medium">ETA:</span>
                  <span>{formatETA(speed.eta)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Page Stats */}
        {batchSync.lastPageStats && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm text-gray-700">
              <div className="font-medium mb-1">Última página processada:</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <span>{batchSync.lastPageStats.videosInPage} vídeos total</span>
                <span>{batchSync.lastPageStats.newInPage} novos</span>
                <span>{batchSync.lastPageStats.updatedInPage} atualizados</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {batchSync.isPaused && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-800">
              ⏸️ Sincronização pausada. Os dados serão preservados ao retomar.
            </div>
          </div>
        )}

        {batchSync.totalStats.errors > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-800">
              ⚠️ {batchSync.totalStats.errors} erro(s) encontrado(s) durante a sincronização.
            </div>
          </div>
        )}

        {/* Progress Insights */}
        {batchSync.emptyPages > 0 && batchSync.emptyPages < batchSync.maxEmptyPages && !isDeepScan && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-sm text-orange-800">
              📊 {batchSync.emptyPages} de {batchSync.maxEmptyPages} páginas consecutivas sem vídeos novos. 
              A sincronização continuará buscando vídeos mais antigos.
            </div>
          </div>
        )}

        {/* Deep Scan Info */}
        {isDeepScan && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-sm text-purple-800">
              🔍 Varredura profunda ativa: processando TODOS os vídeos do canal, independente de serem novos. 
              Isso pode levar tempo, mas garante que nenhum vídeo seja perdido.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
