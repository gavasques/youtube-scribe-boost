
import { Card, CardContent } from '@/components/ui/card'
import { FileCheck } from 'lucide-react'

interface ApprovalEmptyStateProps {
  hasFilters: boolean
}

export function ApprovalEmptyState({ hasFilters }: ApprovalEmptyStateProps) {
  return (
    <Card className="border-rose-200">
      <CardContent className="py-8">
        <div className="text-center">
          <FileCheck className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma aprovação encontrada</h3>
          <p className="text-muted-foreground">
            {hasFilters
              ? 'Tente ajustar os filtros para ver mais resultados.'
              : 'Quando mudanças importantes forem feitas, elas aparecerão aqui para aprovação.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
