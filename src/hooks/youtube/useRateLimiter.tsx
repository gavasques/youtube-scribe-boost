
// Rate Limiter for YouTube API requests - VERSÃO CORRIGIDA
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

  // Método para debug
  getStatus() {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return {
      currentRequests: this.requests.length,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      canMakeRequest: this.requests.length < this.maxRequests,
      remainingRequests: this.maxRequests - this.requests.length,
      oldestRequest: this.requests.length > 0 ? new Date(Math.min(...this.requests)).toISOString() : null
    }
  }
}

// CORREÇÃO: Rate limiter menos restritivo - 5 requests por hora (12 minutos entre cada)
export const rateLimiter = new SimpleRateLimiter(5, 3600000) // 5 requests per hour

export const getRateLimitStatus = () => {
  const status = rateLimiter.getStatus()
  
  // Log para debugging
  console.log('[RATE-LIMIT] Status atual:', status)
  
  return {
    canMakeRequest: rateLimiter.canMakeRequest(),
    remainingTime: rateLimiter.getRemainingTime(),
    remainingRequests: rateLimiter.getRemainingRequests(),
    debug: status
  }
}
