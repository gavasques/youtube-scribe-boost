
import { useMemo } from 'react'
import { Approval } from '@/types/approval'

interface ApprovalStats {
  pending: number
  approved: number
  rejected: number
  total: number
  urgentCount: number
  oldCount: number
}

export function useApprovalStats(approvals: Approval[]): ApprovalStats {
  return useMemo(() => {
    const pending = approvals.filter(a => a.status === 'PENDING').length
    const approved = approvals.filter(a => a.status === 'APPROVED').length
    const rejected = approvals.filter(a => a.status === 'REJECTED').length
    const total = approvals.length
    
    const urgentCount = approvals.filter(a => 
      a.status === 'PENDING' && a.affected_videos_count > 50
    ).length
    
    const oldCount = approvals.filter(a => {
      const createdAt = new Date(a.created_at)
      const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return createdAt < threshold && a.status === 'PENDING'
    }).length

    return {
      pending,
      approved,
      rejected,
      total,
      urgentCount,
      oldCount
    }
  }, [approvals])
}
