
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { Approval, ApprovalTypeLabels, ApprovalStatusLabels } from '@/types/approval'
import { formatApprovalDate, getStatusColors, getTypeColors, isApprovalUrgent, isApprovalOld } from '@/utils/approvalFormatters'

interface ApprovalCardProps {
  approval: Approval
  onView: () => void
  onQuickAction: (approval: Approval, action: 'approve' | 'reject', reason?: string) => void
}

export function ApprovalCard({ approval, onView, onQuickAction }: ApprovalCardProps) {
  const [processing, setProcessing] = useState(false)

  const statusColors = getStatusColors(approval.status)
  const typeColors = getTypeColors(approval.type)
  const isUrgent = isApprovalUrgent(approval)
  const isOld = isApprovalOld(approval)

  const getStatusIcon = () => {
    switch (approval.status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const handleQuickAction = async (action: 'approve' | 'reject') => {
    setProcessing(true)
    try {
      await onQuickAction(approval, action)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card className={`relative ${isUrgent ? 'border-orange-200 bg-orange-50/50' : ''}`}>
      {isUrgent && (
        <div className="absolute -top-2 -right-2">
          <Badge variant="destructive" className="rounded-full">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Urgente
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">{approval.title}</CardTitle>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${statusColors.bg} ${statusColors.text}`}>
                {getStatusIcon()}
                <span className="ml-1">{ApprovalStatusLabels[approval.status]}</span>
              </Badge>
              
              <Badge variant="outline" className={`${typeColors.bg} ${typeColors.text}`}>
                {ApprovalTypeLabels[approval.type]}
              </Badge>

              {isOld && approval.status === 'PENDING' && (
                <Badge variant="outline" className="bg-gray-100 text-gray-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Antiga
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {approval.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {approval.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{approval.affected_videos_count} vídeos afetados</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatApprovalDate(approval.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>

          {approval.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                onClick={() => handleQuickAction('approve')}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleQuickAction('reject')}
                disabled={processing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
