
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
      // Don't show toast for individual transcription errors to avoid spam
      return null
    } finally {
      setLoading(prev => ({ ...prev, [videoId]: false }))
    }
  }, [])

  const updateTranscription = useCallback(async (videoId: string, transcription: string, sourceType: 'manual' | 'auto' | 'uploaded' = 'manual') => {
    try {
      const updated = await VideoTranscriptionService.updateTranscription(videoId, transcription, sourceType)
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

  // Batch fetch transcriptions with error handling
  const fetchTranscriptions = useCallback(async (videoIds: string[]) => {
    const promises = videoIds.map(async (videoId) => {
      try {
        return await fetchTranscription(videoId)
      } catch (error) {
        console.warn(`Failed to fetch transcription for video ${videoId}:`, error)
        return null
      }
    })
    
    await Promise.allSettled(promises)
  }, [fetchTranscription])

  return {
    transcriptions,
    loading,
    fetchTranscription,
    updateTranscription,
    fetchTranscriptions
  }
}
