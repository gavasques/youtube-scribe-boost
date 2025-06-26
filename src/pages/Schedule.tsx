
import { useState } from "react"
import { ScheduleHeader } from "@/components/Schedule/ScheduleHeader"
import { ScheduleTaskList } from "@/components/Schedule/ScheduleTaskList"
import { ScheduleTaskModal } from "@/components/Schedule/ScheduleTaskModal"
import { useScheduledTasks } from "@/hooks/useScheduledTasks"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function Schedule() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  
  const {
    tasks,
    loading,
    error,
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,
    executeTask
  } = useScheduledTasks()

  const handleNewTask = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleEditTask = (taskId: string) => {
    setEditingTask(taskId)
    setIsModalOpen(true)
  }

  const handleExecuteTask = async (taskId: string) => {
    await executeTask(taskId)
  }

  const handlePauseTask = async (taskId: string) => {
    // Pausar = atualizar status para pending se estiver running
    const task = tasks.find(t => t.id === taskId)
    if (task?.status === 'running') {
      await updateTask(taskId, { scheduled_for: new Date().toISOString() })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ScheduleHeader onNewTask={handleNewTask} />
      
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <ScheduleTaskList
        tasks={tasks}
        onExecute={handleExecuteTask}
        onPause={handlePauseTask}
        onEdit={handleEditTask}
        onDelete={deleteTask}
      />

      <ScheduleTaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingTaskId={editingTask}
        tasks={tasks}
        onCreateTask={createTask}
        onUpdateTask={updateTask}
      />
    </div>
  )
}
