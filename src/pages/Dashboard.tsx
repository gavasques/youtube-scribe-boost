
import { useEffect, useState } from "react"
import { MetricCard } from "@/components/Dashboard/MetricCard"
import { QuickActions } from "@/components/Dashboard/QuickActions"
import { ProgressChart } from "@/components/Dashboard/ProgressChart"
import { RecentActivity } from "@/components/Dashboard/RecentActivity"
import { Play, Blocks, Folder, Clock, EyeOff } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface DashboardStats {
  totalVideos: number
  activeBlocks: number
  categories: number
  pendingVideos: number
  ignoredVideos: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    activeBlocks: 0,
    categories: 0,
    pendingVideos: 0,
    ignoredVideos: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      try {
        // Buscar estatísticas em paralelo
        const [videosResult, blocksResult, categoriesResult] = await Promise.all([
          supabase.from('videos').select('update_status', { count: 'exact' }).eq('user_id', user.id),
          supabase.from('blocks').select('*', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true),
          supabase.from('categories').select('*', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true)
        ])

        const totalVideos = videosResult.count || 0
        const activeBlocks = blocksResult.count || 0
        const categories = categoriesResult.count || 0

        // Calcular vídeos pendentes e ignorados
        const pendingVideos = videosResult.data?.filter(v => v.update_status === 'ACTIVE_FOR_UPDATE').length || 0
        const ignoredVideos = videosResult.data?.filter(v => v.update_status === 'IGNORED').length || 0

        setStats({
          totalVideos,
          activeBlocks,
          categories,
          pendingVideos,
          ignoredVideos
        })
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        // Manter valores padrão em caso de erro
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Carregando dados do sistema...
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

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
          value={stats.totalVideos}
          description={stats.totalVideos === 0 ? "Conecte seu YouTube para começar" : "Vídeos sincronizados"}
          icon={Play}
          className="border-l-4 border-red-500 bg-gradient-to-br from-red-50 to-rose-50"
        />
        <MetricCard
          title="Blocos Ativos"
          value={stats.activeBlocks}
          description="Prontos para uso"
          icon={Blocks}
          className="border-l-4 border-purple-500 bg-gradient-to-br from-purple-50 to-violet-50"
        />
        <MetricCard
          title="Categorias Criadas"
          value={stats.categories}
          description="Organizando seu conteúdo"
          icon={Folder}
          className="border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50"
        />
        <MetricCard
          title="Vídeos Pendentes"
          value={stats.pendingVideos}
          description="Aguardando processamento"
          icon={Clock}
          className="border-l-4 border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50"
        />
        <MetricCard
          title="Vídeos Ignorados"
          value={stats.ignoredVideos}
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
