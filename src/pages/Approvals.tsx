
import { useState } from 'react'
import { useApprovals } from '@/hooks/useApprovals'
import { ApprovalCard } from '@/components/Approvals/ApprovalCard'
import { ApprovalModal } from '@/components/Approvals/ApprovalModal'
import { ApprovalFilters } from '@/components/Approvals/ApprovalFilters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Clock, XCircle, FileCheck } from 'lucide-react'
import { Approval, ApprovalStatus, ApprovalType } from '@/types/approval'

export default function Approvals() {
  const { approvals, loading, pendingCount, processApproval } = useApprovals()
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [filters, setFilters] = useState({
    status: 'all' as ApprovalStatus | 'all',
    type: 'all' as ApprovalType | 'all',
    search: ''
  })

  // Filtrar aprovações
  const filteredApprovals = approvals.filter(approval => {
    if (filters.status !== 'all' && approval.status !== filters.status) return false
    if (filters.type !== 'all' && approval.type !== filters.type) return false
    if (filters.search && !approval.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const stats = {
    pending: approvals.filter(a => a.status === 'PENDING').length,
    approved: approvals.filter(a => a.status === 'APPROVED').length,
    rejected: approvals.filter(a => a.status === 'REJECTED').length,
    total: approvals.length
  }

  const handleApprovalAction = async (approval: Approval, action: 'approve' | 'reject', reason?: string) => {
    await processApproval(approval.id, { action, reason })
    setSelectedApproval(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando aprovações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aprovações</h1>
        <p className="text-muted-foreground">
          Gerencie aprovações de mudanças que afetam múltiplos vídeos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando revisão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Processadas com sucesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              Não processadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Todas as aprovações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <ApprovalFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      <Separator />

      {/* Lista de Aprovações */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma aprovação encontrada</h3>
                <p className="text-muted-foreground">
                  {filters.status !== 'all' || filters.type !== 'all' || filters.search
                    ? 'Tente ajustar os filtros para ver mais resultados.'
                    : 'Quando mudanças importantes forem feitas, elas aparecerão aqui para aprovação.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredApprovals.map(approval => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onView={() => setSelectedApproval(approval)}
              onQuickAction={handleApprovalAction}
            />
          ))
        )}
      </div>

      {/* Modal de Detalhes */}
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
