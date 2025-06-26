
import { useToast } from '@/hooks/use-toast'
import { BlockUI } from '@/types/block'

export function useBlockActions() {
  const { toast } = useToast()

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

  return {
    showSuccessMessage,
    showErrorMessage,
    validateBlockAction
  }
}
