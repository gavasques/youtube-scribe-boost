
import { ScheduleTaskCard } from "./ScheduleTaskCard"

interface ScheduleTask {
  id: string
  name: string
  type: string
  scheduledFor: string
  status: string
  description: string
}

interface ScheduleTaskListProps {
  tasks: ScheduleTask[]
  onExecute?: (taskId: string) => void
  onPause?: (taskId: string) => void
  onEdit?: (taskId: string) => void
}

export function ScheduleTaskList({ tasks, onExecute, onPause, onEdit }: ScheduleTaskListProps) {
  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <ScheduleTaskCard
          key={task.id}
          task={task}
          onExecute={onExecute}
          onPause={onPause}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
