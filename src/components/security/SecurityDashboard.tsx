
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuditLog } from '@/hooks/useAuditLog'
import { useRateLimiter } from '@/hooks/useRateLimiter'
import { Shield, Activity, AlertTriangle, Download, Trash2, RefreshCw } from 'lucide-react'

export function SecurityDashboard() {
  const { getAuditLogs, clearAuditLogs } = useAuditLog()
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  // Rate limiter instances for monitoring
  const aiRateLimit = useRateLimiter({ key: 'ai-processing', maxRequests: 5, windowMs: 60000 })
  const syncRateLimit = useRateLimiter({ key: 'youtube-sync', maxRequests: 10, windowMs: 300000 })

  useEffect(() => {
    setAuditLogs(getAuditLogs())
  }, [refreshKey, getAuditLogs])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(auditLogs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  const recentCriticalEvents = auditLogs
    .filter(log => log.severity === 'CRITICAL' || log.severity === 'HIGH')
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Security Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor security events and system health
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportLogs} className="gap-2">
            <Download className="w-4 h-4" />
            Export Logs
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Events logged locally
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {auditLogs.filter(log => log.severity === 'CRITICAL').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Rate Limit</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aiRateLimit.getRemainingRequests()}/5
            </div>
            <p className="text-xs text-muted-foreground">
              Requests remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Rate Limit</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncRateLimit.getRemainingRequests()}/10
            </div>
            <p className="text-xs text-muted-foreground">
              Sync operations remaining
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="usage">Usage Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit Log</CardTitle>
                  <CardDescription>Recent security and system events</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAuditLogs}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No audit events recorded yet
                  </div>
                ) : (
                  auditLogs.slice().reverse().map((log, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge variant="outline" className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.event_type}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.description}
                        </p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              Metadata
                            </summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>High priority security events requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCriticalEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No critical security events
                  </div>
                ) : (
                  recentCriticalEvents.map((log, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-red-900">{log.event_type}</div>
                        <p className="text-sm text-red-700">{log.description}</p>
                        <span className="text-xs text-red-600">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>Rate limiting and API usage information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">AI Processing</h4>
                  <div className="text-sm text-muted-foreground">
                    <div>Remaining: {aiRateLimit.getRemainingRequests()}/5</div>
                    <div>Reset in: {Math.ceil(aiRateLimit.getRemainingTime() / 1000)}s</div>
                    <div>Status: {aiRateLimit.isLimited ? 'Limited' : 'Available'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">YouTube Sync</h4>
                  <div className="text-sm text-muted-foreground">
                    <div>Remaining: {syncRateLimit.getRemainingRequests()}/10</div>
                    <div>Reset in: {Math.ceil(syncRateLimit.getRemainingTime() / 1000)}s</div>
                    <div>Status: {syncRateLimit.isLimited ? 'Limited' : 'Available'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
