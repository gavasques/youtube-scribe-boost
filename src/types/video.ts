
export type VideoType = 'REGULAR' | 'SHORT' | 'LIVE'
export type ConfigurationStatus = 'NOT_CONFIGURED' | 'CONFIGURED' | 'NEEDS_ATTENTION'
export type UpdateStatus = 'ACTIVE_FOR_UPDATE' | 'DO_NOT_UPDATE' | 'IGNORED'

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
  
  // Novos campos com todos os metadados do YouTube
  views_count: number
  likes_count: number
  comments_count: number
  thumbnail_url: string | null
  duration_seconds: number
  duration_formatted: string | null
  privacy_status: string
  
  // Propriedades computadas/extras para UI (mantidas para compatibilidade)
  views?: string
  duration?: string
  category_name?: string
  has_transcription?: boolean
  ai_processed?: boolean
}

export interface VideoFormData {
  title: string
  youtube_url: string
  youtube_id: string
  video_type: VideoType
  category_id?: string
  transcription?: string
  update_status?: UpdateStatus
}

export interface VideoFilters {
  search: string
  configuration_status: string
  update_status: string
  category_id: string
  video_type: string
}
