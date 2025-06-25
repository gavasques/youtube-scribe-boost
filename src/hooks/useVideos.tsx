
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Video, VideoFormData } from '@/types/video'
import { useToast } from '@/hooks/use-toast'

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Buscar vídeos do usuário
  const fetchVideos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setVideos((data || []) as Video[])
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar vídeos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Criar novo vídeo
  const createVideo = async (data: VideoFormData) => {
    try {
      const { data: newVideo, error } = await supabase
        .from('videos')
        .insert([{
          ...data,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

      if (error) throw error

      setVideos(prev => [newVideo as Video, ...prev])
      toast({
        title: 'Vídeo adicionado',
        description: 'O vídeo foi adicionado com sucesso.',
      })
      
      return { data: newVideo, error: null }
    } catch (error) {
      console.error('Erro ao criar vídeo:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar vídeo.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Atualizar vídeo
  const updateVideo = async (id: string, data: Partial<VideoFormData>) => {
    try {
      const { data: updatedVideo, error } = await supabase
        .from('videos')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setVideos(prev => prev.map(v => v.id === id ? updatedVideo as Video : v))
      toast({
        title: 'Vídeo atualizado',
        description: 'O vídeo foi atualizado com sucesso.',
      })
      
      return { data: updatedVideo, error: null }
    } catch (error) {
      console.error('Erro ao atualizar vídeo:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar vídeo.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Remover vídeo
  const deleteVideo = async (video: Video) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id)

      if (error) throw error

      setVideos(prev => prev.filter(v => v.id !== video.id))
      toast({
        title: 'Vídeo removido',
        description: `O vídeo "${video.title}" foi removido com sucesso.`,
      })
      
      return { error: null }
    } catch (error) {
      console.error('Erro ao remover vídeo:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao remover vídeo.',
        variant: 'destructive',
      })
      return { error }
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  return {
    videos,
    loading,
    createVideo,
    updateVideo,
    deleteVideo,
    fetchVideos
  }
}
