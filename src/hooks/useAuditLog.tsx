import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export type AuditEventType = 
  | 'VIDEO_UPDATE'
  | 'BLOCK_APPLICATION'
  | 'APPROVAL_DECISION'
  | 'AI_PROCESSING'
  | 'SYNC_OPERATION'
  | 'RATE_LIMIT_HIT'
  | 'AUTH_FAILURE'
  | 'DATA_EXPORT'
  | 'DATA_DELETION'

interface AuditLogEntry {
  event_type: AuditEventType
  description: string
  metadata?: Record<string, any>
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ip_address?: string
  user_agent?: string
}

export function useAuditLog() {
  const { toast } = useToast()
  const [logging, setLogging] = useState(false)

  const logEvent = async (entry: AuditLogEntry) => {
    try {
      setLogging(true)
      
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        console.warn('Attempted audit log without authentication')
        return
      }

      // Get client info
      const userAgent = navigator.userAgent
      const timestamp = new Date().toISOString()

      const auditEntry = {
        user_id: authData.session.user.id,
        event_type: entry.event_type,
        description: entry.description,
        metadata: {
          ...entry.metadata,
          timestamp,
          session_id: authData.session.access_token.slice(-10) // Last 10 chars for tracking
        },
        severity: entry.severity || 'LOW',
        user_agent: userAgent,
        created_at: timestamp
      }

      // For now, log to console and local storage (later we'll add to database)
      console.log('AUDIT LOG:', auditEntry)
      
      // Store in localStorage for immediate tracking
      const existingLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]')
      existingLogs.push(auditEntry)
      
      // Keep only last 100 entries in localStorage
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100)
      }
      
      localStorage.setItem('audit_logs', JSON.stringify(existingLogs))

      // For critical events, show notification
      if (entry.severity === 'CRITICAL' || entry.severity === 'HIGH') {
        toast({
          title: 'Security Event Logged',
          description: entry.description,
          variant: entry.severity === 'CRITICAL' ? 'destructive' : 'default'
        })
      }

    } catch (error) {
      console.error('Failed to log audit event:', error)
    } finally {
      setLogging(false)
    }
  }

  const getAuditLogs = () => {
    try {
      return JSON.parse(localStorage.getItem('audit_logs') || '[]')
    } catch {
      return []
    }
  }

  const clearAuditLogs = () => {
    localStorage.removeItem('audit_logs')
    toast({
      title: 'Audit logs cleared',
      description: 'Local audit logs have been cleared'
    })
  }

  return {
    logEvent,
    getAuditLogs,
    clearAuditLogs,
    logging
  }
}
