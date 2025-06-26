
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
        // Backward compatibility fields
        views_count: videoMetadata?.views_count || 0,
        likes_count: videoMetadata?.likes_count || 0,
        comments_count: videoMetadata?.comments_count || 0,
        duration_seconds: videoMetadata?.duration_seconds || 0,
        duration_formatted: videoMetadata?.duration_formatted,
        thumbnail_url: videoMetadata?.thumbnail_url,
        privacy_status: videoMetadata?.privacy_status || 'public',
        published_at: videoMetadata?.published_at,
        transcription: videoTranscription?.transcription,
        configuration_status: videoConfiguration?.configuration_status || 'NOT_CONFIGURED',
        update_status: videoConfiguration?.update_status || 'ACTIVE_FOR_UPDATE',
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
