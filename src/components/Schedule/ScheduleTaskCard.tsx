
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Play, Pause, Trash2 } from "lucide-react"
import { getStatusClassName, formatScheduleDate, formatTaskType } from "@/utils/scheduleFormatters"
import { SCHEDULE_MESSAGES } from "@/utils/scheduleConstants"
import { ScheduledTask } from "@/types/schedule"

interface ScheduleTaskCardProps {
  task: ScheduledTask
  onExecute?: (taskId: string) => void
  onPause?: (taskId: string) => void
  onEdit?: (taskId: string) => void
  onDelete?: (taskId: string) => Promise<boolean>
}

export function ScheduleTaskCard({ 
  task, 
  onExecute, 
  onPause, 
  onEdit, 
  onDelete 
}: ScheduleTaskCardProps) {
  const getStatusBadge = (status: string) => {
    const className = getStatusClassName(status as any)
    const text = SCHEDULE_MESSAGES.STATUS[status.toUpperCase() as keyof typeof SCHEDULE_MESSAGES.STATUS] || status
    
    return <Badge variant="outline" className={className}>{text}</Badge>
  }

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      await onDelete?.(task.id)
    }
  }

  const canExecute = task.status === 'pending' && new Date(task.scheduled_for) <= new Date()
  const canPause = task.status === 'running'

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-cyan-600" />
              <h3 className="font-semibold text-cyan-800">{task.name}</h3>
              {getStatusBadge(task.status)}
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatScheduleDate(task.scheduled_for)}
              </span>
              <span>Tipo: {formatTaskType(task.task_type)}</span>
            </div>

            {task.error_message && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                <strong>Erro:</strong> {task.error_message}
              </div>
            )}

            {task.completed_at && task.status === 'completed' && (
              <div className="mt-2 text-xs text-green-600">
                Concluída em: {formatScheduleDate(task.completed_at)}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {canExecute && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={() => onExecute?.(task.id)}
              >
                <Play className="w-4 h-4" />
                {SCHEDULE_MESSAGES.ACTIONS.EXECUTE}
              </Button>
            )}
            
            {canPause && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => onPause?.(task.id)}
              >
                <Pause className="w-4 h-4" />
                {SCHEDULE_MESSAGES.ACTIONS.PAUSE}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
              onClick={() => onEdit?.(task.id)}
            >
              {SCHEDULE_MESSAGES.ACTIONS.EDIT}
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
