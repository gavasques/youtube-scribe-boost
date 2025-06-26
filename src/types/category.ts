
export interface Category {
  id: string
  user_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Propriedade computada para UI
  video_count?: number
}

export interface CategoryFormData {
  name: string
  description?: string
  is_active?: boolean
}
