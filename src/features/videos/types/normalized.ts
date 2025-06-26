
// Normalized video types following Single Responsibility principle

export interface VideoCore {
  id: string
  user_id: string
  youtube_id: string
  youtube_url: string
  title: string
  video_type: 'REGULAR' | 'SHORT' | 'LIVE'
  category_id?: string
  created_at: string
  updated_at: string
}

export interface VideoMetadata {
  id: string
  video_id: string
  views_count: number
  likes_count: number
  comments_count: number
  duration_seconds: number
  duration_formatted?: string
  thumbnail_url?: string
  privacy_status: string
  published_at?: string
  created_at: string
  updated_at: string
}

export interface VideoDescriptions {
  id: string
  video_id: string
  original_description?: string
  current_description?: string
  compiled_description?: string
  created_at: string
  updated_at: string
}

export interface VideoTranscription {
  id: string
  video_id: string
  transcription?: string
  source_type: 'manual' | 'auto' | 'uploaded'
  confidence_score?: number
  created_at: string
  updated_at: string
}

export interface VideoAIContent {
  id: string
  video_id: string
  ai_summary?: string
  ai_description?: string
  ai_chapters?: any[]
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface VideoTag {
  id: string
  video_id: string
  tag_text: string
  tag_type: 'original' | 'current' | 'ai_generated'
  created_at: string
}

export interface VideoConfiguration {
  id: string
  video_id: string
  configuration_status: 'NOT_CONFIGURED' | 'CONFIGURED' | 'NEEDS_ATTENTION'
  update_status: 'ACTIVE_FOR_UPDATE' | 'DO_NOT_UPDATE' | 'IGNORED'
  updated_at: string
}

// Composite interface for full video data (backward compatibility)
export interface VideoWithRelations extends VideoCore {
  metadata?: VideoMetadata
  descriptions?: VideoDescriptions
  transcription?: VideoTranscription
  ai_content?: VideoAIContent
  tags?: VideoTag[]
  configuration?: VideoConfiguration
  category_name?: string
  
  // Backward compatibility fields - flatten common fields for existing components
  views_count: number
  likes_count: number
  comments_count: number
  duration_seconds: number
  duration_formatted?: string
  thumbnail_url?: string
  privacy_status: string
  published_at?: string
  original_description?: string
  current_description?: string
  compiled_description?: string
  transcription_text?: string
  ai_summary?: string
  ai_description?: string
  ai_chapters?: any[]
  original_tags: string[]
  current_tags: string[]
  ai_generated_tags: string[]
  configuration_status: 'NOT_CONFIGURED' | 'CONFIGURED' | 'NEEDS_ATTENTION'
  update_status: 'ACTIVE_FOR_UPDATE' | 'DO_NOT_UPDATE' | 'IGNORED'
  has_transcription: boolean
  ai_processed: boolean
}
