
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface ScheduleHeaderProps {
  onNewTask: () => void
}

export function ScheduleHeader({ onNewTask }: ScheduleHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          Agenda
        </h1>
        <p className="text-muted-foreground">
          Gerencie tarefas agendadas e automações
        </p>
      </div>
      <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0" onClick={onNewTask}>
        <Plus className="w-4 h-4" />
        Nova Tarefa
      </Button>
    </div>
  )
}
