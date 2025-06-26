
import { ApiResponse, SupabaseError, YouTubeApiError, OpenAIApiError } from '@/types/api'

export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as any).success === 'boolean'
  )
}

export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error &&
    typeof (error as any).message === 'string'
  )
}

export function isYouTubeApiError(error: unknown): error is YouTubeApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as any).error === 'object' &&
    'code' in (error as any).error
  )
}

export function isOpenAIApiError(error: unknown): error is OpenAIApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as any).error === 'object' &&
    'type' in (error as any).error
  )
}

export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
