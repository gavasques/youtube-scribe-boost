
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface DashboardStats {
  totalVideos: number
  activeBlocks: number
  categories: number
  pendingVideos: number
  ignoredVideos: number
}

export function useDashboardStats() {
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
    if (!user) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        const [videosResult, blocksResult, categoriesResult] = await Promise.all([
          supabase
            .from('videos')
            .select('update_status', { count: 'exact' })
            .eq('user_id', user.id),
          supabase
            .from('blocks')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('is_active', true),
          supabase
            .from('categories')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('is_active', true)
        ])

        if (videosResult.error) throw videosResult.error
        if (blocksResult.error) throw blocksResult.error
        if (categoriesResult.error) throw categoriesResult.error

        const totalVideos = videosResult.count || 0
        const activeBlocks = blocksResult.count || 0
        const categories = categoriesResult.count || 0

        const pendingVideos = videosResult.data?.filter(v => v.update_status === 'ACTIVE_FOR_UPDATE').length || 0
        const ignoredVideos = videosResult.data?.filter(v => v.update_status === 'IGNORED').length || 0

        setStats({
          totalVideos,
          activeBlocks,
          categories,
          pendingVideos,
          ignoredVideos
        })
        setError(null)
      } catch (error: any) {
        console.error('Erro ao carregar estatísticas:', error)
        setError(error.message || 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  return { stats, loading, error }
}
