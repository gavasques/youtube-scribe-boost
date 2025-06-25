
export interface Category {
  id: string
  name: string
  description?: string
  parent_id?: string
  color: string
  icon: string
  is_active: boolean
  video_count: number
  created_at: string
  children?: Category[]
}

export interface CategoryFormData {
  name: string
  description?: string
  parent_id?: string
  color: string
  icon: string
  is_active: boolean
}
