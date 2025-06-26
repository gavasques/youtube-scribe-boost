
import { z } from 'zod'
import { ApprovalType } from '@/types/approval'

export const approvalFilterSchema = z.object({
  status: z.enum(['all', 'PENDING', 'APPROVED', 'REJECTED']),
  type: z.enum(['all', 'BLOCK_CHANGE', 'MASS_UPDATE', 'SYNC_OPERATION', 'CATEGORY_CHANGE', 'TAG_UPDATE', 'SEASONAL_TEMPLATE']),
  search: z.string()
})

export const approvalActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional()
})

export const validateApprovalAction = (action: string, reason?: string): boolean => {
  if (action === 'reject' && (!reason || reason.trim().length === 0)) {
    return false
  }
  return true
}

export const validateApprovalFilters = (filters: any): boolean => {
  try {
    approvalFilterSchema.parse(filters)
    return true
  } catch {
    return false
  }
}

export const sanitizeSearchTerm = (search: string): string => {
  return search.trim().toLowerCase()
}
