
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Users, 
  FileText,
  Eye
} from 'lucide-react'
import { Approval, ApprovalTypeLabels, ApprovalStatusLabels } from '@/types/approval'
import { ApprovalPreview } from './ApprovalPreview'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ApprovalModalProps {
  approval: Approval
  open: boolean
  onClose: () => void
  onAction: (approval: Approval, action: 'approve' | 'reject', reason?: string) => void
}

export function ApprovalModal({ approval, open, onClose, onAction }: ApprovalModalProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!reason.trim() && action === 'reject') {
      return // Requer motivo para rejeição
    }

    setProcessing(true)
    try {
      await onAction(approval, action, reason.trim() || undefined)
      setReason('')
    } finally {
      setProcessing(false)
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{approval.title}</DialogTitle>
          <DialogDescription>
            Detalhes da aprovação e preview das mudanças
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Tipo */}
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor()}>
              {ApprovalStatusLabels[approval.status]}
            </Badge>
            <Badge variant="outline" className={getTypeColor()}>
              {ApprovalTypeLabels[approval.type]}
            </Badge>
          </div>

          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Vídeos Afetados:</span>
                <span>{approval.affected_videos_count}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Criado em:</span>
                <span>
                  {format(new Date(approval.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {approval.approved_at && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Aprovado em:</span>
                  <span>
                    {format(new Date(approval.approved_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
              )}

              {approval.rejected_at && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Rejeitado em:</span>
                  <span>
                    {format(new Date(approval.rejected_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Descrição */}
          {approval.description && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Descrição
              </Label>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {approval.description}
              </p>
            </div>
          )}

          {/* Motivos de Aprovação/Rejeição */}
          {(approval.approval_reason || approval.rejection_reason) && (
            <div className="space-y-2">
              <Label>
                {approval.approval_reason ? 'Motivo da Aprovação' : 'Motivo da Rejeição'}
              </Label>
              <p className="text-sm bg-muted p-3 rounded-md">
                {approval.approval_reason || approval.rejection_reason}
              </p>
            </div>
          )}

          <Separator />

          {/* Preview das Mudanças */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Preview das Mudanças</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Ocultar' : 'Mostrar'} Preview
              </Button>
            </div>

            {showPreview && (
              <ApprovalPreview approval={approval} />
            )}
          </div>

          {/* Ações */}
          {approval.status === 'PENDING' && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Comentário {approval.status === 'PENDING' ? '(opcional para aprovação, obrigatório para rejeição)' : ''}
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Adicione um comentário sobre sua decisão..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleAction('approve')}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar e Aplicar
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => handleAction('reject')}
                    disabled={processing || !reason.trim()}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>

                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
