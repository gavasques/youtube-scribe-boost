
export const SCHEDULE_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running', 
  COMPLETED: 'completed',
  ERROR: 'error'
} as const

export const SCHEDULE_TASK_TYPES = {
  ACTIVATE_BLOCK: 'activate_block',
  DEACTIVATE_BLOCK: 'deactivate_block',
  SYNC_VIDEOS: 'sync_videos'
} as const

export const SCHEDULE_MESSAGES = {
  STATUS: {
    PENDING: 'Pendente',
    RUNNING: 'Executando',
    COMPLETED: 'Concluída',
    ERROR: 'Erro'
  },
  ACTIONS: {
    EXECUTE: 'Executar',
    PAUSE: 'Pausar',
    EDIT: 'Editar'
  }
}

export type ScheduleStatus = typeof SCHEDULE_STATUS[keyof typeof SCHEDULE_STATUS]
export type ScheduleTaskType = typeof SCHEDULE_TASK_TYPES[keyof typeof SCHEDULE_TASK_TYPES]
