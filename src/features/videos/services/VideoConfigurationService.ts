
import { supabase } from '@/integrations/supabase/client'
import { VideoConfiguration } from '../types/normalized'

export class VideoConfigurationService {
  static async getVideoConfiguration(videoId: string): Promise<VideoConfiguration | null> {
    const { data, error } = await supabase
      .from('video_configuration')
      .select('*')
      .eq('video_id', videoId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  static async updateConfiguration(videoId: string, config: Partial<VideoConfiguration>) {
    const { data, error } = await supabase
      .from('video_configuration')
      .upsert({ video_id: videoId, ...config })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateStatus(videoId: string, configStatus?: string, updateStatus?: string) {
    const updates: any = {}
    if (configStatus) updates.configuration_status = configStatus
    if (updateStatus) updates.update_status = updateStatus

    return this.updateConfiguration(videoId, updates)
  }
}
