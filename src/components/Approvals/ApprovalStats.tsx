
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, XCircle, FileCheck } from 'lucide-react'

interface ApprovalStatsProps {
  stats: {
    pending: number
    approved: number
    rejected: number
    total: number
  }
}

export function ApprovalStats({ stats }: ApprovalStatsProps) {
  return (
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
  )
}
