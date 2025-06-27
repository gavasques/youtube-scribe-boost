
import { useState, useCallback, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { useAuditLog } from './useAuditLog'
import { securityManager } from '@/utils/encryption'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  key: string
  progressiveBackoff?: boolean
  suspiciousThreshold?: number
}

interface RateLimitData {
  count: number
  resetTime: number
  violations: number
  lastViolation: number
  blocked: boolean
  blockUntil: number
}

interface SuspiciousActivity {
  rapidRequests: number
  patternDetected: boolean
  lastActivity: number
}

export function useSecureRateLimiter(config: RateLimitConfig) {
  const { logEvent } = useAuditLog()
  const [rateLimitData, setRateLimitData] = useLocalStorage<RateLimitData>(
    `secure_rate_limit_${config.key}`,
    { 
      count: 0, 
      resetTime: Date.now() + config.windowMs,
      violations: 0,
      lastViolation: 0,
      blocked: false,
      blockUntil: 0
    }
  )
  
  const [suspiciousActivity, setSuspiciousActivity] = useLocalStorage<SuspiciousActivity>(
    `suspicious_activity_${config.key}`,
    {
      rapidRequests: 0,
      patternDetected: false,
      lastActivity: 0
    }
  )

  const [isLimited, setIsLimited] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)

  const detectSuspiciousPattern = useCallback((): boolean => {
    const now = Date.now()
    const timeSinceLastActivity = now - suspiciousActivity.lastActivity
    
    // Detect rapid successive requests (within 100ms)
    if (timeSinceLastActivity < 100) {
      const newRapidCount = suspiciousActivity.rapidRequests + 1
      
      setSuspiciousActivity(prev => ({
        ...prev,
        rapidRequests: newRapidCount,
        lastActivity: now,
        patternDetected: newRapidCount > 10
      }))
      
      if (newRapidCount > 10) {
        logEvent({
          event_type: 'RATE_LIMIT_HIT',
          description: `Suspicious rapid requests detected for ${config.key}`,
          severity: 'HIGH',
          metadata: { rapidRequests: newRapidCount, key: config.key }
        })
        return true
      }
    } else {
      // Reset rapid request counter if enough time has passed
      setSuspiciousActivity(prev => ({
        ...prev,
        rapidRequests: 0,
        lastActivity: now
      }))
    }
    
    return false
  }, [suspiciousActivity, config.key, logEvent, setSuspiciousActivity])

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now()
    
    // Check if currently blocked
    if (rateLimitData.blocked && now < rateLimitData.blockUntil) {
      setIsBlocked(true)
      return true
    } else {
      setIsBlocked(false)
      setRateLimitData(prev => ({ ...prev, blocked: false, blockUntil: 0 }))
    }
    
    // Detect suspicious patterns
    if (detectSuspiciousPattern()) {
      return true
    }
    
    // Reset if window has passed
    if (now >= rateLimitData.resetTime) {
      setRateLimitData({
        count: 0,
        resetTime: now + config.windowMs,
        violations: rateLimitData.violations,
        lastViolation: rateLimitData.lastViolation,
        blocked: false,
        blockUntil: 0
      })
      setIsLimited(false)
      return false
    }
    
    // Check if limit exceeded
    if (rateLimitData.count >= config.maxRequests) {
      const newViolations = rateLimitData.violations + 1
      const blockDuration = config.progressiveBackoff 
        ? Math.min(config.windowMs * Math.pow(2, newViolations), 3600000) // Max 1 hour
        : config.windowMs
      
      setRateLimitData(prev => ({
        ...prev,
        violations: newViolations,
        lastViolation: now,
        blocked: newViolations >= (config.suspiciousThreshold || 3),
        blockUntil: now + blockDuration
      }))
      
      logEvent({
        event_type: 'RATE_LIMIT_HIT',
        description: `Rate limit exceeded for ${config.key}`,
        severity: newViolations >= (config.suspiciousThreshold || 3) ? 'HIGH' : 'MEDIUM',
        metadata: { 
          violations: newViolations, 
          key: config.key,
          blocked: newViolations >= (config.suspiciousThreshold || 3)
        }
      })
      
      setIsLimited(true)
      return true
    }
    
    setIsLimited(false)
    return false
  }, [rateLimitData, config, setRateLimitData, detectSuspiciousPattern, logEvent])

  const incrementCount = useCallback(() => {
    setRateLimitData(prev => ({
      ...prev,
      count: prev.count + 1
    }))
  }, [setRateLimitData])

  const getRemainingTime = useCallback((): number => {
    if (rateLimitData.blocked) {
      return Math.max(0, rateLimitData.blockUntil - Date.now())
    }
    return Math.max(0, rateLimitData.resetTime - Date.now())
  }, [rateLimitData])

  const getRemainingRequests = useCallback((): number => {
    if (Date.now() >= rateLimitData.resetTime) {
      return config.maxRequests
    }
    return Math.max(0, config.maxRequests - rateLimitData.count)
  }, [rateLimitData, config.maxRequests])

  const getSecurityStatus = useCallback(() => {
    return {
      isLimited,
      isBlocked,
      violations: rateLimitData.violations,
      suspiciousActivity: suspiciousActivity.patternDetected,
      currentCount: rateLimitData.count,
      remainingRequests: getRemainingRequests(),
      remainingTime: getRemainingTime()
    }
  }, [isLimited, isBlocked, rateLimitData, suspiciousActivity, getRemainingRequests, getRemainingTime])

  return {
    isLimited,
    isBlocked,
    checkRateLimit,
    incrementCount,
    getRemainingTime,
    getRemainingRequests,
    getSecurityStatus,
    currentCount: rateLimitData.count,
    violations: rateLimitData.violations
  }
}
