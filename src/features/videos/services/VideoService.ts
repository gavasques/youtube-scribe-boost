
import { supabase } from '@/integrations/supabase/client'
import { VideoCore } from '../types/normalized'

export class VideoService {
  static async getVideos(): Promise<VideoCore[]> {
    const { data, error } = await supabase
      .from('videos')
      .select('id, user_id, youtube_id, youtube_url, title, video_type, category_id, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(video => ({
      ...video,
      video_type: video.video_type as 'REGULAR' | 'SHORT' | 'LIVE'
    }))
  }

  static async getVideoById(id: string): Promise<VideoCore | null> {
    const { data, error } = await supabase
      .from('videos')
      .select('id, user_id, youtube_id, youtube_url, title, video_type, category_id, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error) throw error
    
    return data ? {
      ...data,
      video_type: data.video_type as 'REGULAR' | 'SHORT' | 'LIVE'
    } : null
  }

  static async updateVideo(id: string, updates: Partial<VideoCore>) {
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    return {
      ...data,
      video_type: data.video_type as 'REGULAR' | 'SHORT' | 'LIVE'
    }
  }

  static async deleteVideo(id: string) {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
