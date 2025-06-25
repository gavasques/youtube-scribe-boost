
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
        />
        <MetricCard
          title="Blocos Ativos"
          value={7}
          description="Prontos para uso"
          icon={Blocks}
        />
        <MetricCard
          title="Categorias Criadas"
          value={4}
          description="Organizando seu conteúdo"
          icon={Folder}
        />
        <MetricCard
          title="Vídeos Pendentes"
          value={0}
          description="Aguardando processamento"
          icon={Clock}
        />
        <MetricCard
          title="Vídeos Ignorados"
          value={0}
          description="Marcados como ignorados"
          icon={EyeOff}
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
