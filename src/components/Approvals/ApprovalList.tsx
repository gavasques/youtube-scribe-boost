
import { Approval } from '@/types/approval'
import { ApprovalCard } from './ApprovalCard'

interface ApprovalListProps {
  approvals: Approval[]
  onView: (approval: Approval) => void
  onQuickAction: (approval: Approval, action: 'approve' | 'reject', reason?: string) => void
}

export function ApprovalList({ approvals, onView, onQuickAction }: ApprovalListProps) {
  return (
    <div className="space-y-4">
      {approvals.map(approval => (
        <ApprovalCard
          key={approval.id}
          approval={approval}
          onView={() => onView(approval)}
          onQuickAction={onQuickAction}
        />
      ))}
    </div>
  )
}
