
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('Dashboard useEffect triggered, user:', user?.id)
    
    if (!user) {
      console.log('No user found, setting loading to false')
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        console.log('Starting to fetch stats for user:', user.id)
        
        // Buscar estatísticas em paralelo
        console.log('Fetching videos...')
        const videosResult = await supabase
          .from('videos')
          .select('update_status', { count: 'exact' })
          .eq('user_id', user.id)
        
        console.log('Videos result:', videosResult)
        
        console.log('Fetching blocks...')
        const blocksResult = await supabase
          .from('blocks')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true)
        
        console.log('Blocks result:', blocksResult)
        
        console.log('Fetching categories...')
        const categoriesResult = await supabase
          .from('categories')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true)
        
        console.log('Categories result:', categoriesResult)

        // Verificar se houve erros
        if (videosResult.error) {
          console.error('Error fetching videos:', videosResult.error)
          throw videosResult.error
        }
        if (blocksResult.error) {
          console.error('Error fetching blocks:', blocksResult.error)
          throw blocksResult.error
        }
        if (categoriesResult.error) {
          console.error('Error fetching categories:', categoriesResult.error)
          throw categoriesResult.error
        }

        const totalVideos = videosResult.count || 0
        const activeBlocks = blocksResult.count || 0
        const categories = categoriesResult.count || 0

        // Calcular vídeos pendentes e ignorados
        const pendingVideos = videosResult.data?.filter(v => v.update_status === 'ACTIVE_FOR_UPDATE').length || 0
        const ignoredVideos = videosResult.data?.filter(v => v.update_status === 'IGNORED').length || 0

        const newStats = {
          totalVideos,
          activeBlocks,
          categories,
          pendingVideos,
          ignoredVideos
        }

        console.log('Final stats:', newStats)
        setStats(newStats)
        setError(null)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        setError(error.message || 'Erro desconhecido')
        // Manter valores padrão em caso de erro
      } finally {
        console.log('Setting loading to false')
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  console.log('Dashboard render - loading:', loading, 'error:', error, 'user:', user?.id)

  if (loading) {
    console.log('Rendering loading state')
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

  if (error) {
    console.log('Rendering error state:', error)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-red-500">
              Erro ao carregar dados: {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  console.log('Rendering main dashboard with stats:', stats)

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
