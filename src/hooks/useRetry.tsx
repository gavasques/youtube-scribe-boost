
import { useState } from 'react'

interface UseRetryOptions {
  maxAttempts: number
  delay: number
  backoff?: boolean
}

export function useRetry({ maxAttempts, delay, backoff = false }: UseRetryOptions) {
  const [isRetrying, setIsRetrying] = useState(false)

  const retryWithCondition = async <T>(
    fn: () => Promise<T>,
    shouldRetry: (error: any, attemptNumber: number) => boolean
  ): Promise<T> => {
    setIsRetrying(true)
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn()
        setIsRetrying(false)
        return result
      } catch (error) {
        console.log(`Attempt ${attempt}/${maxAttempts} failed:`, error)
        
        if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
          setIsRetrying(false)
          throw error
        }
        
        const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay
        console.log(`Waiting ${currentDelay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, currentDelay))
      }
    }
    
    setIsRetrying(false)
    throw new Error('Max attempts reached')
  }

  return {
    retryWithCondition,
    isRetrying
  }
}
