
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Approval, ApprovalStatus, ApprovalType } from '@/types/approval'
import { APPROVAL_STATUS_COLORS, APPROVAL_TYPE_COLORS, APPROVAL_URGENCY_THRESHOLD, APPROVAL_OLD_THRESHOLD_HOURS } from './approvalConstants'

export const formatApprovalDate = (date: string): string => {
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true, 
    locale: ptBR 
  })
}

export const formatExactDate = (date: string): string => {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

export const getStatusColors = (status: ApprovalStatus) => {
  return APPROVAL_STATUS_COLORS[status] || APPROVAL_STATUS_COLORS.PENDING
}

export const getTypeColors = (type: ApprovalType) => {
  return APPROVAL_TYPE_COLORS[type] || { bg: 'bg-gray-100', text: 'text-gray-800' }
}

export const isApprovalUrgent = (approval: Approval): boolean => {
  return approval.affected_videos_count > APPROVAL_URGENCY_THRESHOLD
}

export const isApprovalOld = (approval: Approval): boolean => {
  const createdAt = new Date(approval.created_at)
  const threshold = new Date(Date.now() - APPROVAL_OLD_THRESHOLD_HOURS * 60 * 60 * 1000)
  return createdAt < threshold && approval.status === 'PENDING'
}

export const formatApprovalDescription = (approval: Approval): string => {
  if (approval.description) {
    return approval.description.length > 150 
      ? `${approval.description.substring(0, 150)}...`
      : approval.description
  }
  return ''
}

export const getApprovalPriority = (approval: Approval): 'high' | 'medium' | 'low' => {
  if (isApprovalUrgent(approval) || isApprovalOld(approval)) return 'high'
  if (approval.affected_videos_count > 10) return 'medium'
  return 'low'
}
