
import { useMemo, useEffect } from 'react'
import { useVideoCore } from './useVideoCore'
import { useVideoMetadata } from './useVideoMetadata'
import { useVideoTranscription } from './useVideoTranscription'
import { useVideoConfiguration } from './useVideoConfiguration'
import { useOptimizedCategories } from '@/features/categories/hooks/useOptimizedCategories'
import { VideoWithRelations } from '../types/normalized'

export function useVideosComposed() {
  const { videos: coreVideos, loading: coreLoading, fetchVideos, updateVideo } = useVideoCore()
  const { metadata, fetchMetadata } = useVideoMetadata()
  const { transcriptions, fetchTranscription } = useVideoTranscription()
  const { configurations, fetchConfiguration } = useVideoConfiguration()
  const { categories } = useOptimizedCategories()

  // Fetch metadata, transcriptions, and configurations for all videos - but only once
  useEffect(() => {
    if (coreVideos.length === 0) return
    
    const fetchPromises = coreVideos.map(async (video) => {
      const promises = []
      
      if (!metadata[video.id]) {
        promises.push(fetchMetadata(video.id))
      }
      if (!transcriptions[video.id]) {
        promises.push(fetchTranscription(video.id))
      }
      if (!configurations[video.id]) {
        promises.push(fetchConfiguration(video.id))
      }
      
      if (promises.length > 0) {
        await Promise.all(promises)
      }
    })
    
    Promise.all(fetchPromises).catch(error => {
      console.error('Error fetching video data:', error)
    })
  }, [coreVideos.length]) // Only depend on length to avoid infinite loops

  // Compose videos with their related data for backward compatibility
  const videos = useMemo(() => {
    return coreVideos.map(video => {
      const videoMetadata = metadata[video.id]
      const videoTranscription = transcriptions[video.id]
      const videoConfiguration = configurations[video.id]
      const category = categories.find(cat => cat.id === video.category_id)

      const composedVideo: VideoWithRelations = {
        // Core video fields (now cleaned up)
        id: video.id,
        user_id: video.user_id,
        youtube_id: video.youtube_id,
        youtube_url: video.youtube_url,
        title: video.title,
        video_type: video.video_type,
        category_id: video.category_id || null,
        published_at: video.published_at || null,
        created_at: video.created_at,
        updated_at: video.updated_at,
        
        // Metadata fields (required by Video interface)
        views_count: videoMetadata?.views_count || 0,
        likes_count: videoMetadata?.likes_count || 0,
        comments_count: videoMetadata?.comments_count || 0,
        duration_seconds: videoMetadata?.duration_seconds || 0,
        duration_formatted: videoMetadata?.duration_formatted || null,
        thumbnail_url: videoMetadata?.thumbnail_url || null,
        privacy_status: videoMetadata?.privacy_status || 'public',
        
        // Description fields (required by Video interface)
        original_description: '',
        current_description: '',
        compiled_description: '',
        
        // Tags arrays (required by Video interface)
        original_tags: [],
        current_tags: [],
        ai_generated_tags: [],
        
        // Transcription field (required by Video interface - use string)
        transcription: videoTranscription?.transcription || null,
        
        // AI fields (required by Video interface)
        ai_summary: '',
        ai_description: '',
        ai_chapters: null,
        
        // Configuration fields (required by Video interface)
        configuration_status: videoConfiguration?.configuration_status || 'NOT_CONFIGURED',
        update_status: videoConfiguration?.update_status || 'ACTIVE_FOR_UPDATE',
        
        // Additional normalized data references
        metadata: videoMetadata,
        descriptions: undefined, // Will be populated later when descriptions service is implemented
        transcription_data: videoTranscription,
        ai_content: undefined, // Will be populated later when AI service is implemented
        tags: [], // Will be populated later when tags service is implemented
        configuration: videoConfiguration,
        category_name: category?.name,
        
        // Helper fields
        has_transcription: !!videoTranscription?.transcription,
        ai_processed: false, // Will be determined by AI content hook when needed
        
        // Computed fields for backward compatibility
        views: videoMetadata?.views_count?.toString(),
        duration: videoMetadata?.duration_formatted
      }

      return composedVideo
    })
  }, [coreVideos, metadata, transcriptions, configurations, categories])

  return {
    videos,
    loading: coreLoading,
    fetchVideos,
    updateVideo
  }
}
