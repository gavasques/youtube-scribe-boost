
import { ScheduledTaskStatus } from '@/types/schedule'

export const formatScheduleDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pt-BR')
}

export const formatTaskType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'activate_block': 'Ativar Bloco',
    'deactivate_block': 'Desativar Bloco', 
    'sync_videos': 'Sincronização YouTube'
  }
  
  return typeMap[type] || type
}

export const getStatusVariant = (status: ScheduledTaskStatus) => {
  switch (status) {
    case 'pending':
      return 'outline'
    case 'running':
      return 'default'
    case 'completed':
      return 'default'
    default:
      return 'destructive'
  }
}

export const getStatusClassName = (status: ScheduledTaskStatus): string => {
  switch (status) {
    case 'pending':
      return 'text-amber-600 border-amber-300 bg-amber-50'
    case 'running':
      return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'
    case 'completed':
      return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0'
    default:
      return 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0'
  }
}
