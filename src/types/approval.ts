
export type ApprovalType = 
  | 'BLOCK_CHANGE'
  | 'MASS_UPDATE' 
  | 'SYNC_OPERATION'
  | 'CATEGORY_CHANGE'
  | 'TAG_UPDATE'
  | 'SEASONAL_TEMPLATE'

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Approval {
  id: string
  user_id: string
  type: ApprovalType
  title: string
  description?: string
  data: any
  status: ApprovalStatus
  affected_videos_count: number
  created_at: string
  approved_at?: string
  rejected_at?: string
  approval_reason?: string
  rejection_reason?: string
  updated_at: string
}

export interface ApprovalFormData {
  type: ApprovalType
  title: string
  description?: string
  data: any
  affected_videos_count: number
}

export interface ApprovalAction {
  action: 'approve' | 'reject'
  reason?: string
}

export const ApprovalTypeLabels: Record<ApprovalType, string> = {
  BLOCK_CHANGE: 'Alteração de Bloco',
  MASS_UPDATE: 'Atualização em Massa',
  SYNC_OPERATION: 'Operação de Sincronização',
  CATEGORY_CHANGE: 'Alteração de Categoria',
  TAG_UPDATE: 'Atualização de Tags',
  SEASONAL_TEMPLATE: 'Template Sazonal'
}

export const ApprovalStatusLabels: Record<ApprovalStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada'
}
