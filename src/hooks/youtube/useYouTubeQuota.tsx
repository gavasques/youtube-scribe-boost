
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/core/Logger'

export interface QuotaStatus {
  hasQuota: boolean
  quotaUsed: number
  quotaLimit: number
  resetTime?: string
  percentageUsed?: number
  remainingQuota?: number
  isExceeded: boolean
}

export const useYouTubeQuota = () => {
  const checkQuotaStatus = async (): Promise<QuotaStatus> => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('youtube_quota_usage')
        .select('*')
        .eq('date', today)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (error) {
        logger.warn('[QUOTA-CHECK] Erro ao verificar quota:', error)
        return { 
          hasQuota: true, 
          quotaUsed: 0, 
          quotaLimit: 10000,
          percentageUsed: 0,
          remainingQuota: 10000,
          isExceeded: false
        }
      }
      
      const quotaUsed = data?.requests_used || 0
      const quotaLimit = 10000 // YouTube API daily limit
      const percentageUsed = Math.round((quotaUsed / quotaLimit) * 100)
      const remainingQuota = quotaLimit - quotaUsed
      const isExceeded = quotaUsed >= quotaLimit
      
      const resetTime = data?.updated_at ? new Date(data.updated_at).toISOString() : undefined
      
      logger.info('[QUOTA-CHECK] Status detalhado da quota:', {
        quotaUsed: quotaUsed.toLocaleString(),
        quotaLimit: quotaLimit.toLocaleString(),
        percentageUsed: `${percentageUsed}%`,
        remainingQuota: remainingQuota.toLocaleString(),
        isExceeded,
        hasQuota: !isExceeded
      })
      
      return {
        hasQuota: !isExceeded,
        quotaUsed,
        quotaLimit,
        resetTime,
        percentageUsed,
        remainingQuota,
        isExceeded
      }
    } catch (error) {
      logger.error('[QUOTA-CHECK] Erro na verificação:', error)
      return { 
        hasQuota: true, 
        quotaUsed: 0, 
        quotaLimit: 10000,
        percentageUsed: 0,
        remainingQuota: 10000,
        isExceeded: false
      }
    }
  }

  return { checkQuotaStatus }
}
