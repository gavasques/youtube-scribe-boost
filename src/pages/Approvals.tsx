
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
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando aprovações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
          Aprovações
        </h1>
        <p className="text-muted-foreground">
          Gerencie aprovações de mudanças que afetam múltiplos vídeos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{stats.pending}</div>
            <p className="text-xs text-orange-600">
              Aguardando revisão
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{stats.approved}</div>
            <p className="text-xs text-emerald-600">
              Processadas com sucesso
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500 bg-gradient-to-br from-red-50 to-rose-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
            <p className="text-xs text-red-600">
              Não processadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
            <p className="text-xs text-blue-600">
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
          <Card className="border-rose-200">
            <CardContent className="py-8">
              <div className="text-center">
                <FileCheck className="h-12 w-12 text-rose-500 mx-auto mb-4" />
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
