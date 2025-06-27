
// Rate Limiter for YouTube API requests
class SimpleRateLimiter {
  private requests: number[] = []
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    if (this.requests.length >= this.maxRequests) {
      return false
    }
    
    this.requests.push(now)
    return true
  }

  getRemainingTime(): number {
    if (this.requests.length < this.maxRequests) return 0
    
    const oldestRequest = Math.min(...this.requests)
    return this.windowMs - (Date.now() - oldestRequest)
  }

  getRemainingRequests(): number {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return Math.max(0, this.maxRequests - this.requests.length)
  }
}

// Rate limiter: 1 request every 10 minutes (very conservative)
export const rateLimiter = new SimpleRateLimiter(1, 600000) // 10 minutes

export const getRateLimitStatus = () => {
  return {
    canMakeRequest: rateLimiter.canMakeRequest(),
    remainingTime: rateLimiter.getRemainingTime(),
    remainingRequests: rateLimiter.getRemainingRequests()
  }
}
