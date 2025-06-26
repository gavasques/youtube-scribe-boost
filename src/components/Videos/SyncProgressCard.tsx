
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Video
} from 'lucide-react'

interface SyncProgress {
  step: string
  current: number
  total: number
  message: string
  errors?: string[]
}

interface SyncProgressCardProps {
  progress: SyncProgress | null
  syncing: boolean
}

export function SyncProgressCard({ progress, syncing }: SyncProgressCardProps) {
  if (!progress && !syncing) return null

  const getProgressPercentage = () => {
    if (!progress) return 0
    return Math.round((progress.current / progress.total) * 100)
  }

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'starting':
      case 'validation':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'fetching':
      case 'details':
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
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
      case 'validation':
        return 'Validando'
      case 'fetching':
        return 'Buscando'
      case 'details':
        return 'Detalhando'
      case 'processing':
        return 'Processando'
      case 'complete':
        return 'Concluído'
      case 'error':
        return 'Erro'
      default:
        return 'Em andamento'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          {progress && getStepIcon(progress.step)}
          Progresso da Sincronização
          <Badge variant={progress?.step === 'complete' ? 'default' : 'secondary'}>
            {progress ? getStepStatus(progress.step) : 'Preparando'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {progress?.message || 'Preparando sincronização...'}
            </span>
            <span className="text-sm text-muted-foreground">
              {progress ? `${progress.current}/${progress.total}` : '0/5'}
            </span>
          </div>
          <Progress 
            value={getProgressPercentage()} 
            className="w-full h-2"
          />
        </div>

        {progress && (
          <div className="text-center text-sm text-muted-foreground">
            {getProgressPercentage()}% concluído
          </div>
        )}

        {progress?.errors && progress.errors.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-1">
                <div className="font-medium">Erros encontrados:</div>
                {progress.errors.map((error, index) => (
                  <div key={index} className="text-xs">
                    • {error}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
