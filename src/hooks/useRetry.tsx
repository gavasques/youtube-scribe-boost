
import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UseRetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: boolean
  retryCondition?: (error: any) => boolean
}

export function useRetry(options: UseRetryOptions = {}) {
  const { maxAttempts = 3, delay = 1000, backoff = true, retryCondition } = options
  const [isRetrying, setIsRetrying] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const { toast } = useToast()

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
        
        // Check if we should retry this error
        if (retryCondition && !retryCondition(error)) {
          console.log('Error does not meet retry condition, stopping attempts')
          break
        }
        
        if (attempt < maxAttempts - 1) {
          const waitTime = backoff ? delay * Math.pow(2, attempt) : delay
          console.log(`Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    setIsRetrying(false)
    setAttempts(0)
    
    // Show error toast for final failure
    toast({
      title: 'Operação falhou',
      description: `Erro após ${maxAttempts} tentativas: ${lastError.message}`,
      variant: 'destructive'
    })
    
    throw lastError!
  }, [maxAttempts, delay, backoff, retryCondition, toast])

  const retryWithCondition = useCallback(async <T,>(
    fn: () => Promise<T>,
    customRetryCondition?: (error: any) => boolean
  ): Promise<T> => {
    const shouldRetry = customRetryCondition || retryCondition || (() => true)
    
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
        
        // Check if we should retry this specific error
        if (!shouldRetry(error)) {
          console.log('Error does not meet retry condition, stopping attempts')
          break
        }
        
        if (attempt < maxAttempts - 1) {
          const waitTime = backoff ? delay * Math.pow(2, attempt) : delay
          console.log(`Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    setIsRetrying(false)
    setAttempts(0)
    
    // Show error toast for final failure
    toast({
      title: 'Operação falhou',
      description: `Erro após ${maxAttempts} tentativas: ${lastError.message}`,
      variant: 'destructive'
    })
    
    throw lastError!
  }, [maxAttempts, delay, backoff, retryCondition, toast])

  return { 
    retry, 
    retryWithCondition,
    isRetrying, 
    attempts 
  }
}
