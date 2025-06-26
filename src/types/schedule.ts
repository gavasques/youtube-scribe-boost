
export type ScheduledTaskType = 'activate_block' | 'deactivate_block' | 'sync_videos'
export type ScheduledTaskStatus = 'pending' | 'running' | 'completed' | 'error'

export interface ScheduledTask {
  id: string
  user_id: string
  name: string
  description?: string
  task_type: ScheduledTaskType
  status: ScheduledTaskStatus
  scheduled_for: string
  executed_at?: string
  completed_at?: string
  task_data: Record<string, any>
  error_message?: string
  created_at: string
  updated_at: string
}

export interface CreateScheduledTaskData {
  name: string
  description?: string
  task_type: ScheduledTaskType
  scheduled_for: string
  task_data?: Record<string, any>
}

export interface UpdateScheduledTaskData {
  name?: string
  description?: string
  scheduled_for?: string
  task_data?: Record<string, any>
}

export interface TaskExecutionResult {
  success: boolean
  message: string
  error?: string
}
