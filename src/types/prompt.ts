
export interface Prompt {
  id: string
  name: string
  description: string
  prompt: string
  temperature: number
  max_tokens: number
  top_p: number
  is_active: boolean
  created_at: string
  updated_at: string
  user_id: string | null
}

export interface PromptFormData {
  name: string
  description: string
  prompt: string
  temperature: number
  max_tokens: number
  top_p: number
  test_input?: string
}
