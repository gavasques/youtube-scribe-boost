
import { useState, useEffect, useCallback } from 'react'
import { useVideoCore } from './useVideoCore'
import { useVideoMetadata } from './useVideoMetadata'
import { useVideoConfiguration } from './useVideoConfiguration'
import { useVideoTranscription } from './useVideoTranscription'
import { VideoWithRelations } from '../types/normalized'
import { useToast } from '@/hooks/use-toast'

export function useVideosComposed() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    videos: coreVideos, 
    loading: coreLoading, 
    fetchVideos: fetchCoreVideos 
  } = useVideoCore()
  
  const { 
    metadata, 
    loading: metadataLoading, 
    fetchMetadata 
  } = useVideoMetadata()
  
  const { 
    configurations, 
    loading: configLoading, 
    fetchConfigurations 
  } = useVideoConfiguration()

  const { transcriptions } = useVideoTranscription()

  // Compose videos with their related data
  const videos: VideoWithRelations[] = coreVideos.map(video => {
    const videoMetadata = metadata[video.id]
    const videoConfig = configurations[video.id]
    const videoTranscription = transcriptions[video.id]

    return {
      ...video,
      // Add metadata fields directly to video for backward compatibility
      views_count: videoMetadata?.views_count || 0,
      likes_count: videoMetadata?.likes_count || 0,
      comments_count: videoMetadata?.comments_count || 0,
      duration_seconds: videoMetadata?.duration_seconds || 0,
      duration_formatted: videoMetadata?.duration_formatted || '0:00',
      thumbnail_url: videoMetadata?.thumbnail_url || null,
      privacy_status: videoMetadata?.privacy_status || 'public',
      
      // Add configuration fields
      configuration_status: videoConfig?.configuration_status || 'NOT_CONFIGURED',
      update_status: videoConfig?.update_status || 'ACTIVE_FOR_UPDATE',
      
      // Add computed fields for UI compatibility
      views: videoMetadata?.views_count?.toString() || '0',
      duration: videoMetadata?.duration_formatted || '0:00',
      has_transcription: !!videoTranscription?.transcription,
      ai_processed: false, // Will be implemented with AI content
      
      // Normalized relations
      metadata: videoMetadata || null,
      configuration: videoConfig || null,
      transcription: videoTranscription || null,
      
      // Legacy fields for backward compatibility
      original_description: null,
      current_description: null,
      compiled_description: null,
      original_tags: [],
      current_tags: [],
      ai_generated_tags: [],
      ai_summary: null,
      ai_description: null,
      ai_chapters: null
    }
  })

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch core videos first
      await fetchCoreVideos()
      
      // Then fetch related data in parallel - but handle errors gracefully
      const promises = [
        fetchMetadata().catch(err => {
          console.warn('Failed to fetch metadata:', err)
          return null
        }),
        fetchConfigurations().catch(err => {
          console.warn('Failed to fetch configurations:', err)
          return null
        })
        // Remove transcription fetching for now to avoid 406 errors
      ]
      
      await Promise.allSettled(promises)
      
    } catch (error) {
      console.error('Error fetching videos:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      
      toast({
        title: 'Erro ao carregar vídeos',
        description: 'Não foi possível carregar a lista de vídeos.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [fetchCoreVideos, fetchMetadata, fetchConfigurations, toast])

  useEffect(() => {
    fetchVideos()
  }, [])

  const overallLoading = coreLoading || metadataLoading || configLoading || loading

  return {
    videos,
    loading: overallLoading,
    error,
    fetchVideos
  }
}
