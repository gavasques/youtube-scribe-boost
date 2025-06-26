
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Approval } from '@/types/approval'
import { useToast } from '@/hooks/use-toast'

export function useApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const { toast } = useToast()

  const fetchApprovals = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('approvals')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const approvalsData = (data || []) as Approval[]
      setApprovals(approvalsData)
      setPendingCount(approvalsData.filter(a => a.status === 'PENDING').length)
    } catch (error) {
      console.error('Erro ao buscar aprovações:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar aprovações.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchApproval = async (approvalId: string): Promise<Approval | null> => {
    try {
      const { data, error } = await supabase
        .from('approvals')
        .select('*')
        .eq('id', approvalId)
        .single()

      if (error) throw error
      return data as Approval
    } catch (error) {
      console.error('Erro ao buscar aprovação específica:', error)
      return null
    }
  }

  useEffect(() => {
    fetchApprovals()
  }, [])

  return {
    approvals,
    loading,
    pendingCount,
    fetchApprovals,
    fetchApproval
  }
}
