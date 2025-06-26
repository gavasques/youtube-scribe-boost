
import { ScheduleTaskCard } from "./ScheduleTaskCard"
import { ScheduledTask } from "@/types/schedule"

interface ScheduleTaskListProps {
  tasks: ScheduledTask[]
  onExecute?: (taskId: string) => void
  onPause?: (taskId: string) => void
  onEdit?: (taskId: string) => void
  onDelete?: (taskId: string) => Promise<boolean>
}

export function ScheduleTaskList({ 
  tasks, 
  onExecute, 
  onPause, 
  onEdit, 
  onDelete 
}: ScheduleTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Nenhuma tarefa agendada</h3>
        <p className="text-gray-500 mt-2">
          Crie sua primeira tarefa agendada para automatizar processos
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <ScheduleTaskCard
          key={task.id}
          task={task}
          onExecute={onExecute}
          onPause={onPause}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
