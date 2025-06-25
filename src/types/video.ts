
export type VideoType = 'REGULAR' | 'SHORT' | 'LIVE'
export type ConfigurationStatus = 'NOT_CONFIGURED' | 'CONFIGURED' | 'PROCESSING'
export type UpdateStatus = 'ACTIVE_FOR_UPDATE' | 'PAUSED' | 'DISABLED'

export interface Video {
  id: string
  user_id: string
  title: string
  youtube_id: string
  youtube_url: string
  video_type: VideoType
  original_description: string | null
  current_description: string | null
  compiled_description: string | null
  original_tags: string[]
  current_tags: string[]
  ai_generated_tags: string[]
  transcription: string | null
  ai_summary: string | null
  ai_description: string | null
  ai_chapters: any | null
  configuration_status: ConfigurationStatus
  update_status: UpdateStatus
  category_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface VideoFormData {
  title: string
  youtube_url: string
  video_type: VideoType
  category_id?: string
  transcription?: string
}
