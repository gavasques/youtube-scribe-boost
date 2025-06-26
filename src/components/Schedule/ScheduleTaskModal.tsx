
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateScheduledTaskData, UpdateScheduledTaskData, ScheduledTask, ScheduledTaskType } from "@/types/schedule"
import { useOptimizedBlocks } from "@/hooks/useOptimizedBlocks"

interface ScheduleTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTaskId: string | null
  tasks: ScheduledTask[]
  onCreateTask: (data: CreateScheduledTaskData) => Promise<boolean>
  onUpdateTask: (taskId: string, data: UpdateScheduledTaskData) => Promise<boolean>
}

export function ScheduleTaskModal({
  open,
  onOpenChange,
  editingTaskId,
  tasks,
  onCreateTask,
  onUpdateTask
}: ScheduleTaskModalProps) {
  const { blocks } = useOptimizedBlocks()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    task_type: 'sync_videos' as ScheduledTaskType,
    scheduled_for: '',
    blockId: '',
    syncOptions: {
      type: 'incremental' as const,
      includeRegular: true,
      includeShorts: true,
      syncMetadata: true,
      maxVideos: 50
    }
  })

  const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) : null
  const isEditing = !!editingTask

  useEffect(() => {
    if (editingTask) {
      setFormData({
        name: editingTask.name,
        description: editingTask.description || '',
        task_type: editingTask.task_type,
        scheduled_for: editingTask.scheduled_for.slice(0, 16), // Format for datetime-local
        blockId: editingTask.task_data?.blockId || '',
        syncOptions: {
          ...formData.syncOptions,
          ...(editingTask.task_data?.syncOptions || {})
        }
      })
    } else {
      // Reset para criar nova tarefa
      setFormData({
        name: '',
        description: '',
        task_type: 'sync_videos',
        scheduled_for: '',
        blockId: '',
        syncOptions: {
          type: 'incremental',
          includeRegular: true,
          includeShorts: true,
          syncMetadata: true,
          maxVideos: 50
        }
      })
    }
  }, [editingTask, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const taskData: CreateScheduledTaskData | UpdateScheduledTaskData = {
        name: formData.name,
        description: formData.description || undefined,
        scheduled_for: new Date(formData.scheduled_for).toISOString(),
        task_data: getTaskData()
      }

      let success: boolean
      if (isEditing) {
        success = await onUpdateTask(editingTask.id, taskData)
      } else {
        success = await onCreateTask({
          ...taskData,
          task_type: formData.task_type
        } as CreateScheduledTaskData)
      }

      if (success) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTaskData = () => {
    switch (formData.task_type) {
      case 'activate_block':
      case 'deactivate_block':
        return { blockId: formData.blockId }
      case 'sync_videos':
        return { syncOptions: formData.syncOptions }
      default:
        return {}
    }
  }

  const renderTaskSpecificFields = () => {
    switch (formData.task_type) {
      case 'activate_block':
      case 'deactivate_block':
        return (
          <div className="space-y-2">
            <Label htmlFor="blockId">Bloco</Label>
            <Select value={formData.blockId} onValueChange={(value) => setFormData({ ...formData, blockId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um bloco" />
              </SelectTrigger>
              <SelectContent>
                {blocks.map((block) => (
                  <SelectItem key={block.id} value={block.id}>
                    {block.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'sync_videos':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxVideos">Máximo de vídeos</Label>
              <Input
                id="maxVideos"
                type="number"
                min="1"
                max="200"
                value={formData.syncOptions.maxVideos}
                onChange={(e) => setFormData({
                  ...formData,
                  syncOptions: {
                    ...formData.syncOptions,
                    maxVideos: parseInt(e.target.value) || 50
                  }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.syncOptions.includeRegular}
                  onChange={(e) => setFormData({
                    ...formData,
                    syncOptions: {
                      ...formData.syncOptions,
                      includeRegular: e.target.checked
                    }
                  })}
                />
                <span>Vídeos regulares</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.syncOptions.includeShorts}
                  onChange={(e) => setFormData({
                    ...formData,
                    syncOptions: {
                      ...formData.syncOptions,
                      includeShorts: e.target.checked
                    }
                  })}
                />
                <span>YouTube Shorts</span>
              </label>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Tarefa' : 'Nova Tarefa Agendada'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da tarefa</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Ativar promoção Black Friday"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da tarefa..."
              rows={3}
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="task_type">Tipo de tarefa</Label>
              <Select value={formData.task_type} onValueChange={(value: ScheduledTaskType) => setFormData({ ...formData, task_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate_block">Ativar Bloco</SelectItem>
                  <SelectItem value="deactivate_block">Desativar Bloco</SelectItem>
                  <SelectItem value="sync_videos">Sincronização YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="scheduled_for">Data e hora</Label>
            <Input
              id="scheduled_for"
              type="datetime-local"
              value={formData.scheduled_for}
              onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
              required
            />
          </div>

          {renderTaskSpecificFields()}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
