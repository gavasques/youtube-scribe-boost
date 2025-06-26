
import { useMemo } from 'react'
import { useVideoCore } from './useVideoCore'
import { useVideoMetadata } from './useVideoMetadata'
import { useVideoTranscription } from './useVideoTranscription'
import { useVideoConfiguration } from './useVideoConfiguration'
import { useOptimizedCategories } from '@/features/categories/hooks/useOptimizedCategories'
import { VideoWithRelations } from '../types/normalized'

export function useVideosComposed() {
  const { videos: coreVideos, loading: coreLoading, fetchVideos, updateVideo } = useVideoCore()
  const { metadata } = useVideoMetadata()
  const { transcriptions } = useVideoTranscription()
  const { configurations } = useVideoConfiguration()
  const { categories } = useOptimizedCategories()

  // Compose videos with their related data for backward compatibility
  const videos = useMemo(() => {
    return coreVideos.map(video => {
      const videoMetadata = metadata[video.id]
      const videoTranscription = transcriptions[video.id]
      const videoConfiguration = configurations[video.id]
      const category = categories.find(cat => cat.id === video.category_id)

      const composedVideo: VideoWithRelations = {
        ...video,
        metadata: videoMetadata,
        transcription: videoTranscription,
        configuration: videoConfiguration,
        category_name: category?.name,
        
        // Backward compatibility fields - flatten data from related tables
        views_count: videoMetadata?.views_count || 0,
        likes_count: videoMetadata?.likes_count || 0,
        comments_count: videoMetadata?.comments_count || 0,
        duration_seconds: videoMetadata?.duration_seconds || 0,
        duration_formatted: videoMetadata?.duration_formatted,
        thumbnail_url: videoMetadata?.thumbnail_url,
        privacy_status: videoMetadata?.privacy_status || 'public',
        published_at: videoMetadata?.published_at,
        
        // Description fields - will be handled by descriptions service later
        original_description: '',
        current_description: '',
        compiled_description: '',
        
        // Transcription field - use the text content
        transcription_text: videoTranscription?.transcription,
        
        // AI fields - will be handled by AI service later
        ai_summary: '',
        ai_description: '',
        ai_chapters: [],
        
        // Tags arrays - will be handled by tags service later
        original_tags: [],
        current_tags: [],
        ai_generated_tags: [],
        
        // Configuration fields
        configuration_status: videoConfiguration?.configuration_status || 'NOT_CONFIGURED',
        update_status: videoConfiguration?.update_status || 'ACTIVE_FOR_UPDATE',
        
        // Helper fields
        has_transcription: !!videoTranscription?.transcription,
        ai_processed: false // Will be determined by AI content hook when needed
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
