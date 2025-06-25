
import { useState, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  key: string
}

interface RateLimitData {
  count: number
  resetTime: number
}

export function useRateLimiter(config: RateLimitConfig) {
  const [rateLimitData, setRateLimitData] = useLocalStorage<RateLimitData>(
    `rate_limit_${config.key}`,
    { count: 0, resetTime: Date.now() + config.windowMs }
  )
  
  const [isLimited, setIsLimited] = useState(false)

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now()
    
    // Reset if window has passed
    if (now >= rateLimitData.resetTime) {
      setRateLimitData({
        count: 0,
        resetTime: now + config.windowMs
      })
      setIsLimited(false)
      return false
    }
    
    // Check if limit exceeded
    if (rateLimitData.count >= config.maxRequests) {
      setIsLimited(true)
      return true
    }
    
    setIsLimited(false)
    return false
  }, [rateLimitData, config, setRateLimitData])

  const incrementCount = useCallback(() => {
    setRateLimitData(prev => ({
      ...prev,
      count: prev.count + 1
    }))
  }, [setRateLimitData])

  const getRemainingTime = useCallback((): number => {
    return Math.max(0, rateLimitData.resetTime - Date.now())
  }, [rateLimitData.resetTime])

  const getRemainingRequests = useCallback((): number => {
    if (Date.now() >= rateLimitData.resetTime) {
      return config.maxRequests
    }
    return Math.max(0, config.maxRequests - rateLimitData.count)
  }, [rateLimitData, config.maxRequests])

  return {
    isLimited,
    checkRateLimit,
    incrementCount,
    getRemainingTime,
    getRemainingRequests,
    currentCount: rateLimitData.count
  }
}
