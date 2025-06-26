
import { supabase } from '@/integrations/supabase/client'
import { VideoMetadata } from '../types/normalized'

export class VideoMetadataService {
  static async getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
    const { data, error } = await supabase
      .from('video_metadata')
      .select('*')
      .eq('video_id', videoId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No data found
      throw error
    }
    return data
  }

  static async updateVideoMetadata(videoId: string, metadata: Partial<VideoMetadata>) {
    const { data, error } = await supabase
      .from('video_metadata')
      .upsert({ video_id: videoId, ...metadata })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async syncMetadataFromYouTube(videoId: string, youtubeData: any) {
    const metadata = {
      video_id: videoId,
      views_count: parseInt(youtubeData.statistics?.viewCount || '0'),
      likes_count: parseInt(youtubeData.statistics?.likeCount || '0'),
      comments_count: parseInt(youtubeData.statistics?.commentCount || '0'),
      duration_seconds: this.parseDuration(youtubeData.contentDetails?.duration),
      duration_formatted: this.formatDuration(youtubeData.contentDetails?.duration),
      thumbnail_url: youtubeData.snippet?.thumbnails?.medium?.url,
      privacy_status: youtubeData.status?.privacyStatus || 'public',
      published_at: youtubeData.snippet?.publishedAt
    }

    return this.updateVideoMetadata(videoId, metadata)
  }

  private static parseDuration(duration?: string): number {
    if (!duration) return 0
    
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')

    return hours * 3600 + minutes * 60 + seconds
  }

  private static formatDuration(duration?: string): string {
    const seconds = this.parseDuration(duration)
    if (seconds === 0) return '0:00'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}
