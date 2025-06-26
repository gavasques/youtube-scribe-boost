
import { supabase } from '@/integrations/supabase/client'
import { VideoAIContent } from '../types/normalized'

export class VideoAIService {
  static async getVideoAIContent(videoId: string): Promise<VideoAIContent | null> {
    const { data, error } = await supabase
      .from('video_ai_content')
      .select('*')
      .eq('video_id', videoId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  static async updateAIContent(videoId: string, content: Partial<VideoAIContent>) {
    const { data, error } = await supabase
      .from('video_ai_content')
      .upsert({ video_id: videoId, ...content })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateProcessingStatus(videoId: string, status: 'pending' | 'processing' | 'completed' | 'failed') {
    return this.updateAIContent(videoId, { processing_status: status })
  }

  static async processWithAI(videoId: string, transcription: string, prompts: any, settings: any) {
    // Mark as processing
    await this.updateProcessingStatus(videoId, 'processing')

    try {
      // Call AI processing edge function
      const { data, error } = await supabase.functions.invoke('ai-processing', {
        body: {
          video_id: videoId,
          transcription,
          prompts,
          settings
        }
      })

      if (error) throw error

      // Update with AI results
      await this.updateAIContent(videoId, {
        ai_summary: data.summary,
        ai_description: data.description,
        ai_chapters: data.chapters,
        processing_status: 'completed'
      })

      return data
    } catch (error) {
      await this.updateProcessingStatus(videoId, 'failed')
      throw error
    }
  }
}
