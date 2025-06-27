
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Zap, Clock, X } from 'lucide-react'
import type { SyncProgress } from '@/hooks/youtube/useSyncState'

interface SyncProgressDisplayProps {
  progress: SyncProgress
  syncing: boolean
  onAbort?: () => void
}

export function SyncProgressDisplay({ progress, syncing, onAbort }: SyncProgressDisplayProps) {
  if (!syncing) return null

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0
  
  return (
    <div className="space-y-6">
      {/* Progresso Principal */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium">Progresso da Sincronização</span>
          <div className="flex items-center gap-2">
            {progress.step === 'aborted' ? (
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">Abortado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-600">Sincronizando...</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{progress.message}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className={`h-3 ${progress.step === 'aborted' ? 'bg-red-100' : ''}`}
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>Página {progress.current} de {progress.total || '?'}</span>
            <span>Etapa: {progress.step}</span>
          </div>
        </div>
      </div>

      {/* Estatísticas em Tempo Real */}
      {progress.pageStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {progress.pageStats.newInPage || 0}
            </div>
            <div className="text-xs text-green-700">Novos nesta página</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progress.pageStats.updatedInPage || 0}
            </div>
            <div className="text-xs text-blue-700">Atualizados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {progress.pageStats.videosInPage || 0}
            </div>
            <div className="text-xs text-purple-700">Vídeos na página</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {progress.totalVideosEstimated || 0}
            </div>
            <div className="text-xs text-gray-700">Total estimado</div>
          </div>
        </div>
      )}

      {/* Velocidade de Processamento */}
      {progress.processingSpeed && (
        <div className="flex items-center justify-center gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">
              {progress.processingSpeed.videosPerMinute.toFixed(1)} vídeos/min
            </span>
          </div>
          {progress.processingSpeed.eta && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                ETA: {new Date(progress.processingSpeed.eta).toLocaleTimeString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3">
        {progress.step !== 'aborted' && progress.step !== 'complete' && progress.step !== 'error' && onAbort && (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={onAbort}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Abortar Sincronização
          </Button>
        )}
        
        <Button variant="outline" disabled>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {progress.step === 'aborted' ? 'Abortado' : 
           progress.step === 'complete' ? 'Concluído' :
           progress.step === 'error' ? 'Erro' :
           'Sincronizando...'}
        </Button>
      </div>
    </div>
  )
}
