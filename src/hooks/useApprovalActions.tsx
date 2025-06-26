
import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { ApprovalFormData, ApprovalAction } from '@/types/approval'
import { useToast } from '@/hooks/use-toast'
import { APPROVAL_MESSAGES } from '@/utils/approvalConstants'

export function useApprovalActions() {
  const { toast } = useToast()

  const createApproval = useCallback(async (data: ApprovalFormData) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('User not authenticated')

      const { data: newApproval, error } = await supabase
        .from('approvals')
        .insert([{
          ...data,
          user_id: user.user.id
        }])
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Aprovação criada',
        description: APPROVAL_MESSAGES.CREATED,
      })
      
      return { data: newApproval, error: null }
    } catch (error) {
      console.error('Erro ao criar aprovação:', error)
      toast({
        title: 'Erro',
        description: APPROVAL_MESSAGES.ERROR,
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }, [toast])

  const processApproval = useCallback(async (id: string, action: ApprovalAction) => {
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

      if (action.action === 'approve') {
        await supabase.functions.invoke('process-approval', {
          body: { approvalId: id }
        })
      }

      toast({
        title: action.action === 'approve' ? 'Aprovação confirmada' : 'Aprovação rejeitada',
        description: action.action === 'approve' ? APPROVAL_MESSAGES.APPROVED : APPROVAL_MESSAGES.REJECTED,
      })
      
      return { data: updatedApproval, error: null }
    } catch (error) {
      console.error('Erro ao processar aprovação:', error)
      toast({
        title: 'Erro',
        description: APPROVAL_MESSAGES.ERROR,
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }, [toast])

  return {
    createApproval,
    processApproval
  }
}
