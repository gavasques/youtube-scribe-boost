
import { useState, useCallback } from 'react'
import { VideoMetadata } from '../types/normalized'
import { VideoMetadataService } from '../services/VideoMetadataService'
import { useToast } from '@/hooks/use-toast'

export function useVideoMetadata() {
  const [metadata, setMetadata] = useState<Record<string, VideoMetadata>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const fetchMetadata = useCallback(async (videoId: string) => {
    try {
      setLoading(prev => ({ ...prev, [videoId]: true }))
      const data = await VideoMetadataService.getVideoMetadata(videoId)
      if (data) {
        setMetadata(prev => ({ ...prev, [videoId]: data }))
      }
      return data
    } catch (error) {
      console.error('Error fetching metadata:', error)
    } finally {
      setLoading(prev => ({ ...prev, [videoId]: false }))
    }
  }, [])

  const updateMetadata = useCallback(async (videoId: string, updates: Partial<VideoMetadata>) => {
    try {
      const updated = await VideoMetadataService.updateVideoMetadata(videoId, updates)
      setMetadata(prev => ({ ...prev, [videoId]: updated }))
      return updated
    } catch (error) {
      console.error('Error updating metadata:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar metadados.',
        variant: 'destructive',
      })
      throw error
    }
  }, [toast])

  const syncFromYouTube = useCallback(async (videoId: string, youtubeData: any) => {
    try {
      const synced = await VideoMetadataService.syncMetadataFromYouTube(videoId, youtubeData)
      setMetadata(prev => ({ ...prev, [videoId]: synced }))
      return synced
    } catch (error) {
      console.error('Error syncing from YouTube:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao sincronizar com YouTube.',
        variant: 'destructive',
      })
      throw error
    }
  }, [toast])

  return {
    metadata,
    loading,
    fetchMetadata,
    updateMetadata,
    syncFromYouTube
  }
}
