
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
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ApprovalCardProps {
  approval: Approval
  onView: () => void
  onQuickAction: (approval: Approval, action: 'approve' | 'reject', reason?: string) => void
}

export function ApprovalCard({ approval, onView, onQuickAction }: ApprovalCardProps) {
  const [processing, setProcessing] = useState(false)

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

  const getStatusColor = () => {
    switch (approval.status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
    }
  }

  const getTypeColor = () => {
    switch (approval.type) {
      case 'BLOCK_CHANGE':
        return 'bg-blue-100 text-blue-800'
      case 'MASS_UPDATE':
        return 'bg-purple-100 text-purple-800'
      case 'SYNC_OPERATION':
        return 'bg-cyan-100 text-cyan-800'
      case 'CATEGORY_CHANGE':
        return 'bg-yellow-100 text-yellow-800'
      case 'TAG_UPDATE':
        return 'bg-pink-100 text-pink-800'
      case 'SEASONAL_TEMPLATE':
        return 'bg-indigo-100 text-indigo-800'
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

  const isUrgent = approval.affected_videos_count > 50
  const isOld = new Date(approval.created_at) < new Date(Date.now() - 24 * 60 * 60 * 1000) // mais de 1 dia

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
              <Badge className={getStatusColor()}>
                {getStatusIcon()}
                <span className="ml-1">{ApprovalStatusLabels[approval.status]}</span>
              </Badge>
              
              <Badge variant="outline" className={getTypeColor()}>
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
            <span>
              {formatDistanceToNow(new Date(approval.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
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
