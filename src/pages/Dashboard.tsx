
import { MetricCard } from "@/components/Dashboard/MetricCard"
import { QuickActions } from "@/components/Dashboard/QuickActions"
import { ProgressChart } from "@/components/Dashboard/ProgressChart"
import { RecentActivity } from "@/components/Dashboard/RecentActivity"
import { Play, Blocks, Folder, Clock, EyeOff } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visão geral do seu canal e atividades do sistema
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          title="Total de Vídeos"
          value={0}
          description="Conecte seu YouTube para começar"
          icon={Play}
          className="border-l-4 border-red-500 bg-gradient-to-br from-red-50 to-rose-50"
        />
        <MetricCard
          title="Blocos Ativos"
          value={7}
          description="Prontos para uso"
          icon={Blocks}
          className="border-l-4 border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50"
        />
        <MetricCard
          title="Categorias Criadas"
          value={4}
          description="Organizando seu conteúdo"
          icon={Folder}
          className="border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50"
        />
        <MetricCard
          title="Vídeos Pendentes"
          value={0}
          description="Aguardando processamento"
          icon={Clock}
          className="border-l-4 border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50"
        />
        <MetricCard
          title="Vídeos Ignorados"
          value={0}
          description="Marcados como ignorados"
          icon={EyeOff}
          className="border-l-4 border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Progress Chart */}
      <ProgressChart />

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  )
}
