
import { supabase } from '@/integrations/supabase/client'
import { VideoTranscription } from '../types/normalized'

export class VideoTranscriptionService {
  static async getVideoTranscription(videoId: string): Promise<VideoTranscription | null> {
    try {
      const { data, error } = await supabase
        .from('video_transcriptions')
        .select('*')
        .eq('video_id', videoId)
        .maybeSingle()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      
      if (!data) return null
      
      return {
        ...data,
        source_type: data.source_type as 'manual' | 'auto' | 'uploaded'
      }
    } catch (error) {
      console.error('VideoTranscriptionService.getVideoTranscription error:', error)
      throw error
    }
  }

  static async updateTranscription(videoId: string, transcription: string, sourceType: 'manual' | 'auto' | 'uploaded' = 'manual') {
    try {
      const { data, error } = await supabase
        .from('video_transcriptions')
        .upsert({
          video_id: videoId,
          transcription,
          source_type: sourceType,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      
      return {
        ...data,
        source_type: data.source_type as 'manual' | 'auto' | 'uploaded'
      }
    } catch (error) {
      console.error('VideoTranscriptionService.updateTranscription error:', error)
      throw error
    }
  }

  static async deleteTranscription(videoId: string) {
    try {
      const { error } = await supabase
        .from('video_transcriptions')
        .delete()
        .eq('video_id', videoId)

      if (error) throw error
    } catch (error) {
      console.error('VideoTranscriptionService.deleteTranscription error:', error)
      throw error
    }
  }

  static async batchGetTranscriptions(videoIds: string[]): Promise<Record<string, VideoTranscription>> {
    try {
      if (videoIds.length === 0) return {}

      const { data, error } = await supabase
        .from('video_transcriptions')
        .select('*')
        .in('video_id', videoIds)

      if (error) {
        console.warn('VideoTranscriptionService.batchGetTranscriptions error:', error)
        return {}
      }

      const transcriptionsMap: Record<string, VideoTranscription> = {}
      
      data?.forEach(item => {
        transcriptionsMap[item.video_id] = {
          ...item,
          source_type: item.source_type as 'manual' | 'auto' | 'uploaded'
        }
      })

      return transcriptionsMap
    } catch (error) {
      console.error('VideoTranscriptionService.batchGetTranscriptions error:', error)
      return {}
    }
  }
}
