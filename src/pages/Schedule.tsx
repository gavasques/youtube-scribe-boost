
import { ScheduleHeader } from "@/components/Schedule/ScheduleHeader"
import { ScheduleTaskList } from "@/components/Schedule/ScheduleTaskList"

export default function Schedule() {
  const tasks = [
    {
      id: "1",
      name: "Ativar Promoção Black Friday", 
      type: "activate_block",
      scheduledFor: "2024-11-20T00:00:00",
      status: "pending",
      description: "Ativar bloco promocional da Black Friday"
    },
    {
      id: "2",
      name: "Desativar Promoção Black Friday",
      type: "deactivate_block", 
      scheduledFor: "2024-11-30T23:59:00",
      status: "pending",
      description: "Desativar bloco promocional da Black Friday"
    },
    {
      id: "3",
      name: "Sincronização Semanal",
      type: "sync_videos",
      scheduledFor: "2024-06-30T02:00:00", 
      status: "completed",
      description: "Sincronização automática com YouTube"
    }
  ]

  const handleNewTask = () => {
    console.log('Nova tarefa')
  }

  const handleExecuteTask = (taskId: string) => {
    console.log('Executar tarefa:', taskId)
  }

  const handlePauseTask = (taskId: string) => {
    console.log('Pausar tarefa:', taskId)
  }

  const handleEditTask = (taskId: string) => {
    console.log('Editar tarefa:', taskId)
  }

  return (
    <div className="space-y-6">
      <ScheduleHeader onNewTask={handleNewTask} />
      
      <ScheduleTaskList
        tasks={tasks}
        onExecute={handleExecuteTask}
        onPause={handlePauseTask}
        onEdit={handleEditTask}
      />
    </div>
  )
}
