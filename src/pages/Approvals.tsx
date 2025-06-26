
import { useState } from 'react'
import { useApprovals } from '@/hooks/useApprovals'
import { useApprovalStats } from '@/hooks/useApprovalStats'
import { useApprovalFilters } from '@/hooks/useApprovalFilters'
import { useApprovalActions } from '@/hooks/useApprovalActions'
import { ApprovalHeader } from '@/components/Approvals/ApprovalHeader'
import { ApprovalStats } from '@/components/Approvals/ApprovalStats'
import { ApprovalFilters } from '@/components/Approvals/ApprovalFilters'
import { ApprovalList } from '@/components/Approvals/ApprovalList'
import { ApprovalEmptyState } from '@/components/Approvals/ApprovalEmptyState'
import { ApprovalModal } from '@/components/Approvals/ApprovalModal'
import { Separator } from '@/components/ui/separator'
import { Approval } from '@/types/approval'

export default function Approvals() {
  const { approvals, loading } = useApprovals()
  const { processApproval } = useApprovalActions()
  const stats = useApprovalStats(approvals)
  const { filters, filteredApprovals, updateFilters, clearFilters, hasActiveFilters } = useApprovalFilters(approvals)
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)

  const handleApprovalAction = async (approval: Approval, action: 'approve' | 'reject', reason?: string) => {
    await processApproval(approval.id, { action, reason })
    setSelectedApproval(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando aprovações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ApprovalHeader pendingCount={stats.pending} />
      <ApprovalStats stats={stats} />
      <ApprovalFilters 
        filters={filters} 
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
      <Separator />

      {filteredApprovals.length === 0 ? (
        <ApprovalEmptyState hasFilters={hasActiveFilters} />
      ) : (
        <ApprovalList
          approvals={filteredApprovals}
          onView={setSelectedApproval}
          onQuickAction={handleApprovalAction}
        />
      )}

      {selectedApproval && (
        <ApprovalModal
          approval={selectedApproval}
          open={!!selectedApproval}
          onClose={() => setSelectedApproval(null)}
          onAction={handleApprovalAction}
        />
      )}
    </div>
  )
}
