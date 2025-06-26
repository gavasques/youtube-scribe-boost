
export type BlockType = 'GLOBAL' | 'CATEGORY_SPECIFIC' | 'MANUAL'
export type BlockScope = 'PERMANENT' | 'SCHEDULED'

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
