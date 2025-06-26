
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Activity {
  id: string
  action: string
  description: string
  time: string
  type: 'info' | 'success' | 'error' | 'warning'
}

export function useDashboardActivity() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchRecentActivity = async () => {
      try {
        // Buscar aprovações recentes
        const { data: approvals } = await supabase
          .from('approvals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3)

        // Buscar blocos recentes
        const { data: blocks } = await supabase
          .from('blocks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2)

        // Buscar categorias recentes
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2)

        const recentActivities: Activity[] = []

        // Adicionar atividades de aprovações
        approvals?.forEach(approval => {
          recentActivities.push({
            id: `approval-${approval.id}`,
            action: approval.status === 'APPROVED' ? 'Aprovação confirmada' : 
                   approval.status === 'REJECTED' ? 'Aprovação rejeitada' : 'Aprovação criada',
            description: approval.title,
            time: formatDistanceToNow(new Date(approval.created_at), { addSuffix: true, locale: ptBR }),
            type: approval.status === 'APPROVED' ? 'success' : 
                  approval.status === 'REJECTED' ? 'error' : 'info'
          })
        })

        // Adicionar atividades de blocos
        blocks?.forEach(block => {
          recentActivities.push({
            id: `block-${block.id}`,
            action: 'Bloco criado',
            description: `Bloco '${block.title}' foi criado`,
            time: formatDistanceToNow(new Date(block.created_at), { addSuffix: true, locale: ptBR }),
            type: 'success'
          })
        })

        // Adicionar atividades de categorias
        categories?.forEach(category => {
          recentActivities.push({
            id: `category-${category.id}`,
            action: 'Categoria adicionada',
            description: `Categoria '${category.name}' foi adicionada`,
            time: formatDistanceToNow(new Date(category.created_at), { addSuffix: true, locale: ptBR }),
            type: 'success'
          })
        })

        // Ordenar por data mais recente
        recentActivities.sort((a, b) => {
          // Como já formatamos o tempo, vamos usar o ID que contém timestamp
          return b.id.localeCompare(a.id)
        })

        setActivities(recentActivities.slice(0, 5))
      } catch (error) {
        console.error('Erro ao buscar atividades:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivity()
  }, [user])

  return { activities, loading }
}
