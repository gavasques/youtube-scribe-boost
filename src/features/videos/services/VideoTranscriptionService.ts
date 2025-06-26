
import { supabase } from '@/integrations/supabase/client'
import { VideoTranscription } from '../types/normalized'

export class VideoTranscriptionService {
  static async getVideoTranscription(videoId: string): Promise<VideoTranscription | null> {
    const { data, error } = await supabase
      .from('video_transcriptions')
      .select('*')
      .eq('video_id', videoId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  static async updateTranscription(videoId: string, transcription: string, sourceType: 'manual' | 'auto' | 'uploaded' = 'manual') {
    const { data, error } = await supabase
      .from('video_transcriptions')
      .upsert({
        video_id: videoId,
        transcription,
        source_type: sourceType
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteTranscription(videoId: string) {
    const { error } = await supabase
      .from('video_transcriptions')
      .delete()
      .eq('video_id', videoId)

    if (error) throw error
  }
}
