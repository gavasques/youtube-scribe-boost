
// Move prompt actions hook to feature folder
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/core/Logger'
import { errorHandler } from '@/core/ErrorHandler'
import { Prompt, PromptFormData } from '../types'

export function usePromptActions() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const showSuccess = (message: string, description?: string) => {
    toast({ title: message, description })
  }

  const showError = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: 'destructive'
    })
  }

  const createPrompt = async (data: PromptFormData): Promise<{ data?: Prompt; error?: string }> => {
    if (!user?.id) {
      return { error: 'Usuário não autenticado' }
    }

    setIsLoading(true)
    try {
      logger.debug('Creating prompt', { data })

      const { data: prompt, error } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description,
          prompt: data.prompt,
          temperature: data.temperature,
          max_tokens: data.max_tokens,
          top_p: data.top_p,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      showSuccess('Prompt criado com sucesso')
      return { data: prompt }
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'usePromptActions.createPrompt',
        showToast: false
      })
      showError('Erro ao criar prompt', appError.message)
      return { error: appError.message }
    } finally {
      setIsLoading(false)
    }
  }

  const updatePrompt = async (id: string, data: PromptFormData): Promise<{ data?: Prompt; error?: string }> => {
    setIsLoading(true)
    try {
      logger.debug('Updating prompt', { id, data })

      const { data: prompt, error } = await supabase
        .from('prompts')
        .update({
          name: data.name,
          description: data.description,
          prompt: data.prompt,
          temperature: data.temperature,
          max_tokens: data.max_tokens,
          top_p: data.top_p
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      showSuccess('Prompt atualizado com sucesso')
      return { data: prompt }
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'usePromptActions.updatePrompt',
        showToast: false
      })
      showError('Erro ao atualizar prompt', appError.message)
      return { error: appError.message }
    } finally {
      setIsLoading(false)
    }
  }

  const togglePromptActive = async (prompt: Prompt): Promise<{ data?: Prompt; error?: string }> => {
    setIsLoading(true)
    try {
      logger.debug('Toggling prompt active status', { promptId: prompt.id, currentStatus: prompt.is_active })

      const { data: updatedPrompt, error } = await supabase
        .from('prompts')
        .update({ is_active: !prompt.is_active })
        .eq('id', prompt.id)
        .select()
        .single()

      if (error) throw error

      const action = updatedPrompt.is_active ? 'ativado' : 'desativado'
      showSuccess(`Prompt "${prompt.name}" foi ${action}`)
      return { data: updatedPrompt }
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'usePromptActions.togglePromptActive',
        showToast: false
      })
      showError('Erro ao alterar status do prompt', appError.message)
      return { error: appError.message }
    } finally {
      setIsLoading(false)
    }
  }

  const duplicatePrompt = async (prompt: Prompt): Promise<{ data?: Prompt; error?: string }> => {
    if (!user?.id) {
      return { error: 'Usuário não autenticado' }
    }

    setIsLoading(true)
    try {
      logger.debug('Duplicating prompt', { promptId: prompt.id })

      const { data: newPrompt, error } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          name: `${prompt.name} (Cópia)`,
          description: prompt.description,
          prompt: prompt.prompt,
          temperature: prompt.temperature,
          max_tokens: prompt.max_tokens,
          top_p: prompt.top_p,
          is_active: false
        })
        .select()
        .single()

      if (error) throw error

      showSuccess('Prompt duplicado com sucesso')
      return { data: newPrompt }
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'usePromptActions.duplicatePrompt',
        showToast: false
      })
      showError('Erro ao duplicar prompt', appError.message)
      return { error: appError.message }
    } finally {
      setIsLoading(false)
    }
  }

  const deletePrompt = async (prompt: Prompt): Promise<{ error?: string }> => {
    setIsLoading(true)
    try {
      logger.debug('Deleting prompt', { promptId: prompt.id })

      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', prompt.id)

      if (error) throw error

      showSuccess(`Prompt "${prompt.name}" foi removido`)
      return {}
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'usePromptActions.deletePrompt',
        showToast: false
      })
      showError('Erro ao remover prompt', appError.message)
      return { error: appError.message }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createPrompt,
    updatePrompt,
    togglePromptActive,
    duplicatePrompt,
    deletePrompt,
    isLoading
  }
}
