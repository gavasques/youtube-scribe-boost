
import { useState, useCallback } from 'react'
import { VideoTranscription } from '../types/normalized'
import { VideoTranscriptionService } from '../services/VideoTranscriptionService'
import { useToast } from '@/hooks/use-toast'

export function useVideoTranscription() {
  const [transcriptions, setTranscriptions] = useState<Record<string, VideoTranscription>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const fetchTranscription = useCallback(async (videoId: string) => {
    try {
      setLoading(prev => ({ ...prev, [videoId]: true }))
      const data = await VideoTranscriptionService.getVideoTranscription(videoId)
      if (data) {
        setTranscriptions(prev => ({ ...prev, [videoId]: data }))
      }
      return data
    } catch (error) {
      console.error('Error fetching transcription:', error)
    } finally {
      setLoading(prev => ({ ...prev, [videoId]: false }))
    }
  }, [])

  const updateTranscription = useCallback(async (videoId: string, updates: Partial<VideoTranscription>) => {
    try {
      const updated = await VideoTranscriptionService.updateVideoTranscription(videoId, updates)
      setTranscriptions(prev => ({ ...prev, [videoId]: updated }))
      toast({
        title: 'Transcrição atualizada',
        description: 'Transcrição foi atualizada com sucesso.',
      })
      return updated
    } catch (error) {
      console.error('Error updating transcription:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar transcrição.',
        variant: 'destructive',
      })
      throw error
    }
  }, [toast])

  return {
    transcriptions,
    loading,
    fetchTranscription,
    updateTranscription
  }
}
