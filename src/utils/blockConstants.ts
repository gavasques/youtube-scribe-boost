
import { Badge } from "@/components/ui/badge"
import { Globe, FolderTree, FileText, Calendar } from "lucide-react"

export const BLOCK_TYPES = {
  GLOBAL: 'GLOBAL',
  CATEGORY_SPECIFIC: 'CATEGORY_SPECIFIC', 
  MANUAL: 'MANUAL'
} as const

export const BLOCK_SCOPES = {
  PERMANENT: 'PERMANENT',
  SCHEDULED: 'SCHEDULED'
} as const

export const BLOCK_TYPE_LABELS = {
  [BLOCK_TYPES.GLOBAL]: 'Global - Aplica a todos os vídeos',
  [BLOCK_TYPES.CATEGORY_SPECIFIC]: 'Categoria - Aplica apenas a categorias específicas',
  [BLOCK_TYPES.MANUAL]: 'Manual - Gerenciado pelo sistema'
} as const

export const BLOCK_SCOPE_LABELS = {
  [BLOCK_SCOPES.PERMANENT]: 'Permanente - Sempre ativo',
  [BLOCK_SCOPES.SCHEDULED]: 'Agendado - Ativo apenas em período específico'
} as const

export const getBlockTypeIcon = (type: string) => {
  const iconMap = {
    [BLOCK_TYPES.GLOBAL]: Globe,
    [BLOCK_TYPES.CATEGORY_SPECIFIC]: FolderTree,
    [BLOCK_TYPES.MANUAL]: FileText
  }
  
  return iconMap[type as keyof typeof iconMap] || Globe
}

export const getBlockTypeBadgeVariant = (type: string) => {
  if (type === BLOCK_TYPES.MANUAL) return "outline"
  return type === BLOCK_TYPES.GLOBAL ? "default" : "outline"
}

export const getBlockStatusBadgeVariant = (isActive: boolean, type?: string) => {
  if (type === BLOCK_TYPES.MANUAL) return "default"
  return isActive ? "default" : "secondary"
}

export const canEditBlock = (type: string): boolean => type !== BLOCK_TYPES.MANUAL
export const canDeleteBlock = (type: string): boolean => type !== BLOCK_TYPES.MANUAL  
export const canToggleBlock = (type: string): boolean => type !== BLOCK_TYPES.MANUAL
