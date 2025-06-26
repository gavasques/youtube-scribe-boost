
import { useState, useEffect } from 'react'
import { VideoCore } from '../types/normalized'
import { VideoService } from '../services/VideoService'
import { useToast } from '@/hooks/use-toast'

export function useVideoCore() {
  const [videos, setVideos] = useState<VideoCore[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const data = await VideoService.getVideos()
      setVideos(data)
    } catch (error) {
      console.error('Error fetching videos:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar vídeos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateVideo = async (id: string, updates: Partial<VideoCore>) => {
    try {
      const updatedVideo = await VideoService.updateVideo(id, updates)
      setVideos(prev => prev.map(v => v.id === id ? updatedVideo : v))
      return updatedVideo
    } catch (error) {
      console.error('Error updating video:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar vídeo.',
        variant: 'destructive',
      })
      throw error
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  return {
    videos,
    loading,
    fetchVideos,
    updateVideo
  }
}
