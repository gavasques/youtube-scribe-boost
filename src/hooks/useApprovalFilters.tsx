
import { useState, useMemo, useCallback } from 'react'
import { Approval, ApprovalStatus, ApprovalType } from '@/types/approval'
import { sanitizeSearchTerm } from '@/utils/approvalValidation'

interface ApprovalFilters {
  status: ApprovalStatus | 'all'
  type: ApprovalType | 'all'
  search: string
}

export function useApprovalFilters(approvals: Approval[]) {
  const [filters, setFilters] = useState<ApprovalFilters>({
    status: 'all',
    type: 'all',
    search: ''
  })

  const filteredApprovals = useMemo(() => {
    return approvals.filter(approval => {
      if (filters.status !== 'all' && approval.status !== filters.status) return false
      if (filters.type !== 'all' && approval.type !== filters.type) return false
      
      if (filters.search) {
        const searchTerm = sanitizeSearchTerm(filters.search)
        const titleMatch = approval.title.toLowerCase().includes(searchTerm)
        const descriptionMatch = approval.description?.toLowerCase().includes(searchTerm)
        if (!titleMatch && !descriptionMatch) return false
      }
      
      return true
    })
  }, [approvals, filters])

  const updateFilters = useCallback((newFilters: Partial<ApprovalFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      type: 'all',
      search: ''
    })
  }, [])

  const hasActiveFilters = filters.status !== 'all' || filters.type !== 'all' || filters.search.length > 0

  return {
    filters,
    filteredApprovals,
    updateFilters,
    clearFilters,
    hasActiveFilters
  }
}
