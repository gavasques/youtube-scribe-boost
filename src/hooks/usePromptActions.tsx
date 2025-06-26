
import { supabase } from '@/integrations/supabase/client'
import { Prompt, PromptFormData } from '@/types/prompt'
import { useToast } from '@/hooks/use-toast'
import { PROMPT_DEFAULTS, PROMPT_MESSAGES } from '@/utils/promptConstants'

export function usePromptActions() {
  const { toast } = useToast()

  const createPrompt = async (data: PromptFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: 'Erro',
          description: PROMPT_MESSAGES.ERROR.AUTH,
          variant: 'destructive',
        })
        return { data: null, error: 'User not authenticated' }
      }

      const { data: newPrompt, error } = await supabase
        .from('prompts')
        .insert([{
          ...data,
          user_id: user.id,
          is_active: PROMPT_DEFAULTS.DEFAULT_ACTIVE_STATUS
        }])
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Prompt criado',
        description: PROMPT_MESSAGES.SUCCESS.CREATED,
      })
      
      return { data: newPrompt, error: null }
    } catch (error) {
      console.error('Erro ao criar prompt:', error)
      toast({
        title: 'Erro',
        description: PROMPT_MESSAGES.ERROR.CREATE,
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  const updatePrompt = async (id: string, data: PromptFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: 'Erro',
          description: PROMPT_MESSAGES.ERROR.AUTH,
          variant: 'destructive',
        })
        return { data: null, error: 'User not authenticated' }
      }

      const { data: updatedPrompt, error } = await supabase
        .from('prompts')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Prompt atualizado',
        description: PROMPT_MESSAGES.SUCCESS.UPDATED,
      })
      
      return { data: updatedPrompt, error: null }
    } catch (error) {
      console.error('Erro ao atualizar prompt:', error)
      toast({
        title: 'Erro',
        description: PROMPT_MESSAGES.ERROR.UPDATE,
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  const togglePromptActive = async (prompt: Prompt) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || (prompt.user_id && prompt.user_id !== user.id)) {
        toast({
          title: 'Erro',
          description: PROMPT_MESSAGES.ERROR.PERMISSION,
          variant: 'destructive',
        })
        return { data: null, error: 'Permission denied' }
      }

      const { data: updatedPrompt, error } = await supabase
        .from('prompts')
        .update({ is_active: !prompt.is_active })
        .eq('id', prompt.id)
        .select()
        .single()

      if (error) throw error

      toast({
        title: prompt.is_active ? PROMPT_MESSAGES.SUCCESS.DEACTIVATED : PROMPT_MESSAGES.SUCCESS.ACTIVATED,
        description: 'Status do prompt alterado com sucesso.',
      })
      
      return { data: updatedPrompt, error: null }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast({
        title: 'Erro',
        description: PROMPT_MESSAGES.ERROR.TOGGLE,
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  const duplicatePrompt = async (prompt: Prompt) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: 'Erro',
          description: PROMPT_MESSAGES.ERROR.AUTH,
          variant: 'destructive',
        })
        return { data: null, error: 'User not authenticated' }
      }

      const { data: duplicatedPrompt, error } = await supabase
        .from('prompts')
        .insert([{
          name: `${prompt.name} (Cópia)`,
          description: prompt.description,
          prompt: prompt.prompt,
          temperature: prompt.temperature,
          max_tokens: prompt.max_tokens,
          top_p: prompt.top_p,
          is_active: false,
          user_id: user.id
        }])
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Prompt duplicado',
        description: PROMPT_MESSAGES.SUCCESS.DUPLICATED,
      })
      
      return { data: duplicatedPrompt, error: null }
    } catch (error) {
      console.error('Erro ao duplicar prompt:', error)
      toast({
        title: 'Erro',
        description: PROMPT_MESSAGES.ERROR.DUPLICATE,
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  const deletePrompt = async (prompt: Prompt) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || (prompt.user_id && prompt.user_id !== user.id)) {
        toast({
          title: 'Erro',
          description: PROMPT_MESSAGES.ERROR.PERMISSION,
          variant: 'destructive',
        })
        return { error: 'Permission denied' }
      }

      if (!prompt.user_id) {
        toast({
          title: 'Erro',
          description: PROMPT_MESSAGES.ERROR.GLOBAL_DELETE,
          variant: 'destructive',
        })
        return { error: 'Cannot delete global prompt' }
      }

      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', prompt.id)

      if (error) throw error

      toast({
        title: 'Prompt removido',
        description: `O prompt "${prompt.name}" ${PROMPT_MESSAGES.SUCCESS.DELETED}`,
      })
      
      return { error: null }
    } catch (error) {
      console.error('Erro ao remover prompt:', error)
      toast({
        title: 'Erro',
        description: PROMPT_MESSAGES.ERROR.DELETE,
        variant: 'destructive',
      })
      return { error }
    }
  }

  return {
    createPrompt,
    updatePrompt,
    togglePromptActive,
    duplicatePrompt,
    deletePrompt
  }
}
