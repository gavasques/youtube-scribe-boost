
export const formatBlockType = (type: string): string => {
  const typeMap = {
    'GLOBAL': 'Global',
    'CATEGORY_SPECIFIC': 'Categoria',
    'MANUAL': 'Descrições dos Vídeos'
  } as const
  
  return typeMap[type as keyof typeof typeMap] || type
}

export const formatBlockScope = (scope: string): string => {
  const scopeMap = {
    'PERMANENT': 'Permanente',
    'SCHEDULED': 'Agendado'
  } as const
  
  return scopeMap[scope as keyof typeof scopeMap] || scope
}

export const formatBlockStatus = (isActive: boolean, type?: string): string => {
  if (type === 'MANUAL') return 'Sempre Ativo'
  return isActive ? 'Ativo' : 'Inativo'
}

export const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

export const formatSchedulePeriod = (start?: string, end?: string): string => {
  if (!start || !end) return 'N/A'
  return `${start} - ${end}`
}
