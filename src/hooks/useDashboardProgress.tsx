
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/core/Logger'
import { errorHandler } from '@/core/ErrorHandler'

interface ProgressItem {
  label: string
  progress: number
  description: string
}

interface UseDashboardProgressResult {
  data: ProgressItem[]
  loading: boolean
  error: string | null
}

export function useDashboardProgress(): UseDashboardProgressResult {
  const [data, setData] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchProgressData = async () => {
      try {
        setLoading(true)
        setError(null)

        logger.debug('Fetching progress data for user', { userId: user.id })

        // Check YouTube connection
        const { data: youtubeTokens } = await supabase
          .from('youtube_tokens')
          .select('id')
          .eq('user_id', user.id)
          .single()

        logger.debug('YouTube tokens result', { hasTokens: !!youtubeTokens })

        // Count active blocks
        const { count: blocksCount } = await supabase
          .from('blocks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true)

        logger.debug('Blocks count', { count: blocksCount })

        // Count categories
        const { count: categoriesCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true)

        logger.debug('Categories count', { count: categoriesCount })

        // Count prompts
        const { count: promptsCount } = await supabase
          .from('prompts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true)

        logger.debug('Prompts count', { count: promptsCount })

        // Count processed videos
        const { count: processedVideosCount } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('ai_summary', 'is', null)

        logger.debug('Processed videos count', { count: processedVideosCount })

        const progressData: ProgressItem[] = [
          {
            label: 'Conexão YouTube',
            progress: youtubeTokens ? 100 : 0,
            description: youtubeTokens ? 'Conectado com sucesso' : 'Conecte sua conta'
          },
          {
            label: 'Blocos Configurados',
            progress: Math.min((blocksCount || 0) * 10, 100),
            description: `${blocksCount || 0} blocos criados`
          },
          {
            label: 'Categorias Criadas',
            progress: Math.min((categoriesCount || 0) * 20, 100),
            description: `${categoriesCount || 0} categorias criadas`
          },
          {
            label: 'Prompts IA',
            progress: Math.min((promptsCount || 0) * 25, 100),
            description: `${promptsCount || 0} prompts configurados`
          },
          {
            label: 'Vídeos Processados',
            progress: Math.min((processedVideosCount || 0) * 5, 100),
            description: `${processedVideosCount || 0} vídeos processados`
          }
        ]

        logger.debug('Final progress data', progressData)
        setData(progressData)
      } catch (err) {
        const appError = errorHandler.handle(err, {
          context: 'useDashboardProgress',
          showToast: false
        })
        setError(appError.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProgressData()
  }, [user?.id])

  return { data, loading, error }
}
