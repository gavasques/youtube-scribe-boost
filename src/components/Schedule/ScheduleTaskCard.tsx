
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Play, Pause } from "lucide-react"
import { getStatusClassName, formatScheduleDate, formatTaskType } from "@/utils/scheduleFormatters"
import { SCHEDULE_MESSAGES } from "@/utils/scheduleConstants"

interface ScheduleTask {
  id: string
  name: string
  type: string
  scheduledFor: string
  status: string
  description: string
}

interface ScheduleTaskCardProps {
  task: ScheduleTask
  onExecute?: (taskId: string) => void
  onPause?: (taskId: string) => void
  onEdit?: (taskId: string) => void
}

export function ScheduleTaskCard({ task, onExecute, onPause, onEdit }: ScheduleTaskCardProps) {
  const getStatusBadge = (status: string) => {
    const className = getStatusClassName(status as any)
    const text = SCHEDULE_MESSAGES.STATUS[status.toUpperCase() as keyof typeof SCHEDULE_MESSAGES.STATUS] || status
    
    return <Badge variant="outline" className={className}>{text}</Badge>
  }

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
            
            <p className="text-sm text-muted-foreground mb-2">
              {task.description}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatScheduleDate(task.scheduledFor)}
              </span>
              <span>Tipo: {formatTaskType(task.type)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {task.status === "pending" && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => onExecute?.(task.id)}
                >
                  <Play className="w-4 h-4" />
                  {SCHEDULE_MESSAGES.ACTIONS.EXECUTE}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => onPause?.(task.id)}
                >
                  <Pause className="w-4 h-4" />
                  {SCHEDULE_MESSAGES.ACTIONS.PAUSE}
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
              onClick={() => onEdit?.(task.id)}
            >
              {SCHEDULE_MESSAGES.ACTIONS.EDIT}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
