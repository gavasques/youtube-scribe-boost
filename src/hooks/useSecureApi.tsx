
import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useRateLimiter } from './useRateLimiter'

interface SecureApiOptions {
  rateLimitKey: string
  maxRequests?: number
  windowMs?: number
  retries?: number
}

export function useSecureApi(options: SecureApiOptions) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const rateLimiter = useRateLimiter({
    key: options.rateLimitKey,
    maxRequests: options.maxRequests || 10,
    windowMs: options.windowMs || 60000 // 1 minute
  })

  const callSecureFunction = useCallback(async (
    functionName: string,
    payload: any = {},
    retryCount = 0
  ): Promise<any> => {
    // Check rate limit
    if (rateLimiter.checkRateLimit()) {
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime() / 1000)
      toast({
        title: 'Limite de requisições atingido',
        description: `Tente novamente em ${remainingTime} segundos`,
        variant: 'destructive'
      })
      throw new Error('Rate limit exceeded')
    }

    setLoading(true)
    
    try {
      // Validate payload size
      const payloadSize = JSON.stringify(payload).length
      if (payloadSize > 1024 * 1024) { // 1MB limit
        throw new Error('Payload muito grande')
      }

      // Get auth session
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('Não autenticado')
      }

      // Increment rate limit counter
      rateLimiter.incrementCount()

      // Call function
      const response = await supabase.functions.invoke(functionName, {
        body: {
          ...payload,
          timestamp: Date.now(), // Add timestamp for security
          userId: authData.session.user.id // Explicit user ID
        },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
          'X-Request-ID': crypto.randomUUID() // Add request ID for tracking
        }
      })

      if (response.error) {
        throw new Error(response.error.message || 'Erro na API')
      }

      return response.data

    } catch (error: any) {
      console.error(`Error calling ${functionName}:`, error)
      
      // Retry logic for network errors
      if (
        retryCount < (options.retries || 2) &&
        (error.message.includes('network') || error.message.includes('timeout'))
      ) {
        console.log(`Retrying ${functionName}, attempt ${retryCount + 1}`)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
        return callSecureFunction(functionName, payload, retryCount + 1)
      }

      // Sanitize error message for security
      const sanitizedError = error.message
        .replace(/Bearer [a-zA-Z0-9\-._~+/]+=*/g, 'Bearer [REDACTED]')
        .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '[UUID-REDACTED]')

      toast({
        title: 'Erro na operação',
        description: sanitizedError,
        variant: 'destructive'
      })

      throw new Error(sanitizedError)
    } finally {
      setLoading(false)
    }
  }, [rateLimiter, toast, options.retries])

  return {
    callSecureFunction,
    loading,
    rateLimitInfo: {
      isLimited: rateLimiter.isLimited,
      remainingRequests: rateLimiter.getRemainingRequests(),
      remainingTime: rateLimiter.getRemainingTime()
    }
  }
}
