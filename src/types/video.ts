
export interface Video {
  id: string
  youtube_id: string
  youtube_url: string
  title: string
  thumbnail_url?: string
  category_id?: string
  category_name?: string
  configuration_status: 'NOT_CONFIGURED' | 'CONFIGURED' | 'NEEDS_ATTENTION'
  update_status: 'ACTIVE_FOR_UPDATE' | 'DO_NOT_UPDATE' | 'IGNORED'
  video_type: 'REGULAR' | 'SHORT'
  published_at: string
  views: string
  duration?: string
  original_description?: string
  current_description?: string
  compiled_description?: string
  transcription?: string
  has_transcription: boolean
  ai_processed: boolean
  ai_summary?: string
  ai_chapters?: any[]
  ai_description?: string
  ai_generated_tags?: string[]
  original_tags?: string[]
  current_tags?: string[]
  created_at: string
  updated_at: string
}

export interface VideoFormData {
  category_id?: string
  update_status: string
  transcription?: string
}

export interface VideoFilters {
  search: string
  configuration_status: string
  update_status: string
  category_id: string
  video_type: string
}
