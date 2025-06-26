
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/core/Logger'
import { errorHandler } from '@/core/ErrorHandler'
import { BlockUI, BlockFormData } from '@/types/block'

export function useBlockActions() {
  const { toast } = useToast()
  const { user } = useAuth()

  const showSuccessMessage = (action: string, blockTitle: string) => {
    const messages = {
      created: 'Bloco criado com sucesso',
      updated: 'Bloco atualizado com sucesso', 
      deleted: `Bloco "${blockTitle}" foi removido`,
      activated: `Bloco "${blockTitle}" foi ativado`,
      deactivated: `Bloco "${blockTitle}" foi desativado`,
      moved: 'Bloco movido com sucesso'
    }
    
    toast({
      title: messages[action as keyof typeof messages] || 'Ação realizada',
      description: action === 'created' || action === 'updated' ? '' : undefined
    })
  }

  const showErrorMessage = (action: string, error?: string) => {
    const messages = {
      create: 'Erro ao criar bloco',
      update: 'Erro ao atualizar bloco',
      delete: 'Erro ao remover bloco',
      toggle: 'Erro ao alterar status do bloco',
      move: 'Erro ao mover bloco'
    }
    
    toast({
      title: messages[action as keyof typeof messages] || 'Erro',
      description: error || 'Tente novamente',
      variant: 'destructive'
    })
  }

  const validateBlockAction = (block: BlockUI, action: string): boolean => {
    if (block.type === 'MANUAL') {
      const restrictions = {
        edit: 'O bloco "Descrições dos Vídeos" não pode ser editado',
        delete: 'O bloco "Descrições dos Vídeos" não pode ser removido',
        toggle: 'O bloco "Descrições dos Vídeos" está sempre ativo'
      }
      
      if (restrictions[action as keyof typeof restrictions]) {
        showErrorMessage(action, restrictions[action as keyof typeof restrictions])
        return false
      }
    }
    
    return true
  }

  const createBlock = async (data: BlockFormData): Promise<{ data?: BlockUI; error?: string }> => {
    if (!user?.id) {
      return { error: 'Usuário não autenticado' }
    }

    try {
      logger.debug('Creating block', { data })

      const blockData = {
        user_id: user.id,
        title: data.title,
        content: data.content,
        type: data.type,
        scope: data.scope,
        priority: data.priority || 0,
        is_active: data.is_active ?? true,
        scheduled_start: data.scheduled_start || null,
        scheduled_end: data.scheduled_end || null,
        video_id: data.video_id || null
      }

      const { data: block, error } = await supabase
        .from('blocks')
        .insert(blockData)
        .select()
        .single()

      if (error) throw error

      const convertedBlock: BlockUI = {
        id: block.id,
        title: block.title,
        content: block.content,
        type: block.type,
        scope: block.scope,
        priority: block.priority,
        isActive: block.is_active,
        scheduledStart: block.scheduled_start,
        scheduledEnd: block.scheduled_end,
        categories: [],
        createdAt: block.created_at,
        videoId: block.video_id
      }

      showSuccessMessage('created', block.title)
      return { data: convertedBlock }
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'useBlockActions.createBlock',
        showToast: false
      })
      showErrorMessage('create', appError.message)
      return { error: appError.message }
    }
  }

  const updateBlock = async (id: string, data: BlockFormData): Promise<{ data?: BlockUI; error?: string }> => {
    try {
      logger.debug('Updating block', { id, data })

      const updateData = {
        title: data.title,
        content: data.content,
        type: data.type,
        scope: data.scope,
        priority: data.priority || 0,
        is_active: data.is_active ?? true,
        scheduled_start: data.scheduled_start || null,
        scheduled_end: data.scheduled_end || null,
        video_id: data.video_id || null
      }

      const { data: block, error } = await supabase
        .from('blocks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const convertedBlock: BlockUI = {
        id: block.id,
        title: block.title,
        content: block.content,
        type: block.type,
        scope: block.scope,
        priority: block.priority,
        isActive: block.is_active,
        scheduledStart: block.scheduled_start,
        scheduledEnd: block.scheduled_end,
        categories: [],
        createdAt: block.created_at,
        videoId: block.video_id
      }

      showSuccessMessage('updated', block.title)
      return { data: convertedBlock }
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'useBlockActions.updateBlock',
        showToast: false
      })
      showErrorMessage('update', appError.message)
      return { error: appError.message }
    }
  }

  const toggleBlockActive = async (block: BlockUI): Promise<{ data?: BlockUI; error?: string }> => {
    try {
      logger.debug('Toggling block active status', { blockId: block.id, currentStatus: block.isActive })

      const { data: updatedBlock, error } = await supabase
        .from('blocks')
        .update({ is_active: !block.isActive })
        .eq('id', block.id)
        .select()
        .single()

      if (error) throw error

      const convertedBlock: BlockUI = {
        ...block,
        isActive: updatedBlock.is_active
      }

      showSuccessMessage(updatedBlock.is_active ? 'activated' : 'deactivated', block.title)
      return { data: convertedBlock }
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'useBlockActions.toggleBlockActive',
        showToast: false
      })
      showErrorMessage('toggle', appError.message)
      return { error: appError.message }
    }
  }

  const deleteBlock = async (block: BlockUI): Promise<{ error?: string }> => {
    try {
      logger.debug('Deleting block', { blockId: block.id })

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', block.id)

      if (error) throw error

      showSuccessMessage('deleted', block.title)
      return {}
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'useBlockActions.deleteBlock',
        showToast: false
      })
      showErrorMessage('delete', appError.message)
      return { error: appError.message }
    }
  }

  return {
    showSuccessMessage,
    showErrorMessage,
    validateBlockAction,
    createBlock,
    updateBlock,
    toggleBlockActive,
    deleteBlock
  }
}
