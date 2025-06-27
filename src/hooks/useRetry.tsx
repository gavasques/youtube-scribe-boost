
import { useState, useCallback } from 'react'

interface UseRetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: boolean
}

export function useRetry(options: UseRetryOptions = {}) {
  const { maxAttempts = 3, delay = 1000, backoff = true } = options
  const [isRetrying, setIsRetrying] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const retry = useCallback(async <T,>(
    fn: () => Promise<T>
  ): Promise<T> => {
    setIsRetrying(true)
    let lastError: Error

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        setAttempts(attempt + 1)
        const result = await fn()
        setIsRetrying(false)
        setAttempts(0)
        return result
      } catch (error) {
        lastError = error as Error
        console.warn(`Attempt ${attempt + 1} failed:`, error)
        
        if (attempt < maxAttempts - 1) {
          const waitTime = backoff ? delay * Math.pow(2, attempt) : delay
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    setIsRetrying(false)
    setAttempts(0)
    throw lastError!
  }, [maxAttempts, delay, backoff])

  return { retry, isRetrying, attempts }
}
