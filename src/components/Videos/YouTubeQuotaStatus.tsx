
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface QuotaUsage {
  requests_used: number
  date: string
  updated_at: string
}

interface QuotaStatusProps {
  className?: string
}

export function YouTubeQuotaStatus({ className = "" }: QuotaStatusProps) {
  const [quotaUsage, setQuotaUsage] = useState<QuotaUsage | null>(null)
  const [loading, setLoading] = useState(true)
  
  const dailyLimit = 10000
  const today = new Date().toISOString().split('T')[0]
  
  useEffect(() => {
    fetchQuotaUsage()
  }, [])

  const fetchQuotaUsage = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Use RPC call to safely query the table
      const { data, error } = await supabase.rpc('get_quota_usage', {
        p_user_id: user.id,
        p_date: today
      }) as { data: QuotaUsage[] | null, error: any }

      if (error) {
        console.error('Error fetching quota usage:', error)
        return
      }

      if (data && data.length > 0) {
        const quotaData = data[0]
        setQuotaUsage({
          requests_used: quotaData.requests_used || 0,
          date: quotaData.date,
          updated_at: quotaData.updated_at
        })
      }
    } catch (error) {
      console.error('Error fetching quota usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestsUsed = quotaUsage?.requests_used || 0
  const usagePercentage = (requestsUsed / dailyLimit) * 100
  const remainingRequests = dailyLimit - requestsUsed

  const getStatusInfo = () => {
    if (usagePercentage >= 90) {
      return {
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        status: 'critical' as const,
        message: 'Quota quase esgotada'
      }
    } else if (usagePercentage >= 70) {
      return {
        icon: Clock,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        status: 'warning' as const,
        message: 'Quota alta'
      }
    } else {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        status: 'good' as const,
        message: 'Quota disponível'
      }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            YouTube API Quota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className} ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="w-4 h-4" />
          YouTube API Quota
          <Badge 
            variant={statusInfo.status === 'critical' ? 'destructive' : 
                   statusInfo.status === 'warning' ? 'secondary' : 'default'}
            className="ml-auto"
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.message}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Usado hoje: {requestsUsed.toLocaleString()}</span>
            <span>Limite: {dailyLimit.toLocaleString()}</span>
          </div>
          
          <Progress 
            value={usagePercentage} 
            className="h-2"
          />
          
          <div className="flex justify-between text-xs">
            <span className={statusInfo.color}>
              {usagePercentage.toFixed(1)}% usado
            </span>
            <span className="text-muted-foreground">
              {remainingRequests.toLocaleString()} restantes
            </span>
          </div>

          {quotaUsage?.updated_at && (
            <p className="text-xs text-muted-foreground">
              Última atualização: {new Date(quotaUsage.updated_at).toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
