
import { Badge } from '@/components/ui/badge'
import { FileCheck } from 'lucide-react'

interface ApprovalHeaderProps {
  pendingCount: number
}

export function ApprovalHeader({ pendingCount }: ApprovalHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
            Aprovações
          </h1>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              <FileCheck className="h-3 w-3 mr-1" />
              {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Gerencie aprovações de mudanças que afetam múltiplos vídeos
        </p>
      </div>
    </div>
  )
}
