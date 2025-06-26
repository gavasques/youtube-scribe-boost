
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader"
import { DashboardStats } from "@/components/Dashboard/DashboardStats"
import { QuickActions } from "@/components/Dashboard/QuickActions"
import { ProgressChart } from "@/components/Dashboard/ProgressChart"
import { RecentActivity } from "@/components/Dashboard/RecentActivity"
import { useDashboardStats } from "@/hooks/useDashboardStats"

export default function Dashboard() {
  const { stats, loading, error } = useDashboardStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardHeader />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardHeader />
        <div className="text-center py-8">
          <p className="text-red-500">Erro ao carregar dados: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <DashboardStats stats={stats} />
      <QuickActions />
      <ProgressChart />
      <RecentActivity />
    </div>
  )
}
