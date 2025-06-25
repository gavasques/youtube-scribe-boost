
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Approval, ApprovalFormData, ApprovalAction } from '@/types/approval'
import { useToast } from '@/hooks/use-toast'

export function useApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const { toast } = useToast()

  // Buscar aprovações do usuário
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

  // Criar nova aprovação
  const createApproval = async (data: ApprovalFormData) => {
    try {
      const { data: newApproval, error } = await supabase
        .from('approvals')
        .insert([{
          ...data,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

      if (error) throw error

      setApprovals(prev => [newApproval as Approval, ...prev])
      setPendingCount(prev => prev + 1)
      
      toast({
        title: 'Aprovação criada',
        description: 'Uma nova aprovação foi criada e está pendente de revisão.',
      })
      
      return { data: newApproval, error: null }
    } catch (error) {
      console.error('Erro ao criar aprovação:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar aprovação.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Processar aprovação (aprovar ou rejeitar)
  const processApproval = async (id: string, action: ApprovalAction) => {
    try {
      const updateData: any = {
        status: action.action === 'approve' ? 'APPROVED' : 'REJECTED',
        updated_at: new Date().toISOString()
      }

      if (action.action === 'approve') {
        updateData.approved_at = new Date().toISOString()
        updateData.approval_reason = action.reason
      } else {
        updateData.rejected_at = new Date().toISOString()
        updateData.rejection_reason = action.reason
      }

      const { data: updatedApproval, error } = await supabase
        .from('approvals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setApprovals(prev => prev.map(a => a.id === id ? updatedApproval as Approval : a))
      setPendingCount(prev => prev - 1)

      // Se aprovado, chamar Edge Function para processar
      if (action.action === 'approve') {
        await supabase.functions.invoke('process-approval', {
          body: { approvalId: id }
        })
      }

      toast({
        title: action.action === 'approve' ? 'Aprovação confirmada' : 'Aprovação rejeitada',
        description: `A aprovação foi ${action.action === 'approve' ? 'aprovada e processada' : 'rejeitada'} com sucesso.`,
      })
      
      return { data: updatedApproval, error: null }
    } catch (error) {
      console.error('Erro ao processar aprovação:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao processar aprovação.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Buscar aprovação específica
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
    createApproval,
    processApproval,
    fetchApprovals,
    fetchApproval
  }
}
