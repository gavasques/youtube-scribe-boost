
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { ScheduledTask, CreateScheduledTaskData, UpdateScheduledTaskData, TaskExecutionResult } from '@/types/schedule'

export function useScheduledTasks() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true })

      if (fetchError) throw fetchError

      // Type cast para garantir compatibilidade com nossa interface
      const typedTasks: ScheduledTask[] = (data || []).map(task => ({
        ...task,
        task_data: (task.task_data as Record<string, any>) || {}
      }))

      setTasks(typedTasks)
    } catch (err: any) {
      console.error('Error fetching scheduled tasks:', err)
      setError(err.message || 'Erro ao buscar tarefas agendadas')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = async (taskData: CreateScheduledTaskData): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const { error } = await supabase
        .from('scheduled_tasks')
        .insert({
          ...taskData,
          user_id: user.id
        })

      if (error) throw error

      toast({
        title: 'Tarefa criada',
        description: 'Tarefa agendada criada com sucesso'
      })

      await fetchTasks()
      return true
    } catch (err: any) {
      console.error('Error creating scheduled task:', err)
      toast({
        title: 'Erro ao criar tarefa',
        description: err.message || 'Não foi possível criar a tarefa agendada',
        variant: 'destructive'
      })
      return false
    }
  }

  const updateTask = async (taskId: string, taskData: UpdateScheduledTaskData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_tasks')
        .update(taskData)
        .eq('id', taskId)
        .eq('user_id', user?.id)

      if (error) throw error

      toast({
        title: 'Tarefa atualizada',
        description: 'Tarefa agendada atualizada com sucesso'
      })

      await fetchTasks()
      return true
    } catch (err: any) {
      console.error('Error updating scheduled task:', err)
      toast({
        title: 'Erro ao atualizar tarefa',
        description: err.message || 'Não foi possível atualizar a tarefa agendada',
        variant: 'destructive'
      })
      return false
    }
  }

  const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user?.id)

      if (error) throw error

      toast({
        title: 'Tarefa removida',
        description: 'Tarefa agendada removida com sucesso'
      })

      await fetchTasks()
      return true
    } catch (err: any) {
      console.error('Error deleting scheduled task:', err)
      toast({
        title: 'Erro ao remover tarefa',
        description: err.message || 'Não foi possível remover a tarefa agendada',
        variant: 'destructive'
      })
      return false
    }
  }

  const executeTask = async (taskId: string): Promise<boolean> => {
    try {
      // Marcar como running
      const { error: updateError } = await supabase
        .from('scheduled_tasks')
        .update({
          status: 'running',
          executed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user?.id)

      if (updateError) throw updateError

      // Chamar Edge Function para executar
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('Não autenticado')
      }

      const response = await supabase.functions.invoke('execute-scheduled-task', {
        body: { taskId },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.error) {
        throw new Error(response.error.message || 'Erro na execução da tarefa')
      }

      const result = response.data as TaskExecutionResult

      if (result.success) {
        toast({
          title: 'Tarefa executada',
          description: result.message
        })
      } else {
        toast({
          title: 'Erro na execução',
          description: result.error || result.message,
          variant: 'destructive'
        })
      }

      await fetchTasks()
      return result.success
    } catch (err: any) {
      console.error('Error executing scheduled task:', err)
      
      // Reverter status se houve erro
      await supabase
        .from('scheduled_tasks')
        .update({
          status: 'error',
          error_message: err.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)

      toast({
        title: 'Erro ao executar tarefa',
        description: err.message || 'Não foi possível executar a tarefa',
        variant: 'destructive'
      })

      await fetchTasks()
      return false
    }
  }

  return {
    tasks,
    loading,
    error,
    refreshTasks: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    executeTask
  }
}
