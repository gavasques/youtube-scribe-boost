
export interface ApiResponse<T = any> {
  data: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  count: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, any>
}

export interface ApiRequestConfig {
  retries?: number
  timeout?: number
  cache?: boolean
}

export interface SupabaseError {
  message: string
  details: string
  hint: string
  code: string
}

export interface YouTubeApiError {
  error: {
    code: number
    message: string
    errors: Array<{
      domain: string
      reason: string
      message: string
    }>
  }
}

export interface OpenAIApiError {
  error: {
    message: string
    type: string
    param?: string
    code?: string
  }
}
