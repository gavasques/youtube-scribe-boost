
export const formatMetricValue = (value: number): string => {
  if (value === 0) return '0'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return value.toString()
}

export const formatMetricDescription = (metricType: string, value: number): string => {
  switch (metricType) {
    case 'total_videos':
      return value === 0 ? 'Conecte seu YouTube para começar' : 'Vídeos sincronizados'
    case 'active_blocks':
      return 'Prontos para uso'
    case 'categories':
      return 'Organizando seu conteúdo'
    case 'pending_videos':
      return 'Aguardando processamento'
    case 'ignored_videos':
      return 'Marcados como ignorados'
    default:
      return ''
  }
}

export const calculateProgress = (current: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((current / total) * 100)
}

export const formatProgressLabel = (progress: number): string => {
  if (progress === 0) return 'Nenhum progresso'
  if (progress < 25) return 'Iniciando'
  if (progress < 50) return 'Em andamento'
  if (progress < 75) return 'Progredindo'
  if (progress < 100) return 'Quase completo'
  return 'Concluído'
}
