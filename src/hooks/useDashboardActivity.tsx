
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/core/Logger'
import { errorHandler } from '@/core/ErrorHandler'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityItem {
  id: string
  action: string
  description: string
  type: 'success' | 'error' | 'warning' | 'info'
  time: string
}

interface UseDashboardActivityResult {
  activities: ActivityItem[]
  loading: boolean
  error: string | null
}

export function useDashboardActivity(): UseDashboardActivityResult {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchActivities = async () => {
      try {
        setLoading(true)
        setError(null)

        // Buscar atividades reais do banco
        const { data: recentBlocks } = await supabase
          .from('blocks')
          .select('id, title, created_at, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(3)

        const { data: recentVideos } = await supabase
          .from('videos')
          .select('id, title, created_at, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(3)

        const { data: recentCategories } = await supabase
          .from('categories')
          .select('id, name, created_at, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(2)

        // Converter para atividades
        const activityItems: ActivityItem[] = []

        // Adicionar blocos
        recentBlocks?.forEach(block => {
          activityItems.push({
            id: `block-${block.id}`,
            action: `Bloco "${block.title}" atualizado`,
            description: 'Bloco de conteúdo modificado',
            type: 'success',
            time: formatDistanceToNow(new Date(block.updated_at), { 
              addSuffix: true, 
              locale: ptBR 
            })
          })
        })

        // Adicionar vídeos
        recentVideos?.forEach(video => {
          activityItems.push({
            id: `video-${video.id}`,
            action: `Vídeo "${video.title}" sincronizado`,
            description: 'Novo vídeo importado do YouTube',
            type: 'info',
            time: formatDistanceToNow(new Date(video.updated_at), { 
              addSuffix: true, 
              locale: ptBR 
            })
          })
        })

        // Adicionar categorias
        recentCategories?.forEach(category => {
          activityItems.push({
            id: `category-${category.id}`,
            action: `Categoria "${category.name}" criada`,
            description: 'Nova categoria de organização',
            type: 'success',
            time: formatDistanceToNow(new Date(category.updated_at), { 
              addSuffix: true, 
              locale: ptBR 
            })
          })
        })

        // Ordenar por tempo (mais recente primeiro) e limitar
        activityItems.sort((a, b) => {
          const timeA = new Date(a.time.replace(' atrás', '').replace('há ', ''))
          const timeB = new Date(b.time.replace(' atrás', '').replace('há ', ''))
          return timeB.getTime() - timeA.getTime()
        })

        setActivities(activityItems.slice(0, 5))
      } catch (err) {
        const appError = errorHandler.handle(err, {
          context: 'useDashboardActivity',
          showToast: false
        })
        setError(appError.message)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [user?.id])

  return { activities, loading, error }
}
