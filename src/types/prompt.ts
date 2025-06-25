
export type PromptType = 
  | "SUMMARY_GENERATOR"
  | "CHAPTER_GENERATOR" 
  | "DESCRIPTION_GENERATOR"
  | "TAG_GENERATOR"
  | "CATEGORY_CLASSIFIER"

export interface Prompt {
  id: string
  name: string
  description: string
  type: PromptType
  system_prompt: string
  user_prompt: string
  temperature: number
  max_tokens: number
  top_p: number
  is_active: boolean
  version: string
  created_at: string
  updated_at: string
}

export interface PromptFormData {
  name: string
  description: string
  type: PromptType
  system_prompt: string
  user_prompt: string
  temperature: number
  max_tokens: number
  top_p: number
  test_input?: string
}
