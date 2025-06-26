
export type BlockType = 'GLOBAL' | 'CATEGORY_SPECIFIC' | 'MANUAL'
export type BlockScope = 'PERMANENT' | 'SCHEDULED'

// Tipo original do banco (snake_case)
export interface Block {
  id: string
  user_id: string
  title: string
  content: string
  type: BlockType
  scope: BlockScope
  priority: number
  is_active: boolean
  scheduled_start: string | null
  scheduled_end: string | null
  video_id: string | null
  created_at: string
  updated_at: string
}

// Tipo convertido para interface (camelCase)
export interface BlockUI {
  id: string
  title: string
  content: string
  type: BlockType
  scope: BlockScope
  priority: number
  isActive: boolean
  scheduledStart?: string
  scheduledEnd?: string
  categories: string[]
  createdAt: string
  videoId?: string
  videoTitle?: string
  videoDescription?: string
}

export interface BlockFormData {
  title: string
  content: string
  type: BlockType
  scope: BlockScope
  priority?: number
  is_active?: boolean
  scheduled_start?: string
  scheduled_end?: string
  video_id?: string
}
