
import { Category } from '@/types/category'

export const formatCategoryStatus = (isActive: boolean): string => {
  return isActive ? 'Ativa' : 'Inativa'
}

export const formatVideoCount = (count: number): { text: string; label: string } => {
  return {
    text: count.toString(),
    label: count === 1 ? 'vídeo' : 'vídeos'
  }
}

export const formatCategoryName = (name: string): string => {
  return name.trim()
}

export const formatCategoryDescription = (description?: string | null): string => {
  return description?.trim() || ''
}

export const formatToggleMessage = (category: Category): string => {
  const action = category.is_active ? 'desativada' : 'ativada'
  return `A categoria "${category.name}" foi ${action}.`
}

export const formatDeleteMessage = (categoryName: string): string => {
  return `A categoria "${categoryName}" foi removida com sucesso.`
}
