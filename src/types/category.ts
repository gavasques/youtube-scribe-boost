
export interface Category {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  parent_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CategoryFormData {
  name: string
  description?: string
  icon?: string
  color?: string
  parent_id?: string
  is_active?: boolean
}
