
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Prompt, PromptFormData } from '@/types/prompt'
import { useToast } from '@/hooks/use-toast'

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Buscar prompts do usuário e prompts globais
  const fetchPrompts = async () => {
    try {
      setLoading(true)
      console.log('Fetching prompts...')
      
      // Buscar todos os prompts (globais e do usuário)
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching prompts:', error)
        throw error
      }
      
      console.log('Prompts fetched:', data)
      setPrompts((data || []) as Prompt[])
    } catch (error) {
      console.error('Erro ao buscar prompts:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar prompts.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Criar novo prompt
  const createPrompt = async (data: PromptFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para criar prompts.',
          variant: 'destructive',
        })
        return { data: null, error: 'User not authenticated' }
      }

      const { data: newPrompt, error } = await supabase
        .from('prompts')
        .insert([{
          ...data,
          user_id: user.id
        }])
        .select()
        .single()

      if (error) throw error

      setPrompts(prev => [newPrompt as Prompt, ...prev])
      toast({
        title: 'Prompt criado',
        description: 'O prompt foi criado com sucesso.',
      })
      
      return { data: newPrompt, error: null }
    } catch (error) {
      console.error('Erro ao criar prompt:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar prompt.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Atualizar prompt
  const updatePrompt = async (id: string, data: PromptFormData) => {
    try {
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

      setPrompts(prev => prev.map(p => p.id === id ? updatedPrompt as Prompt : p))
      toast({
        title: 'Prompt atualizado',
        description: 'O prompt foi atualizado com sucesso.',
      })
      
      return { data: updatedPrompt, error: null }
    } catch (error) {
      console.error('Erro ao atualizar prompt:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar prompt.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Ativar/desativar prompt
  const togglePromptActive = async (prompt: Prompt) => {
    try {
      const { data: updatedPrompt, error } = await supabase
        .from('prompts')
        .update({ is_active: !prompt.is_active })
        .eq('id', prompt.id)
        .select()
        .single()

      if (error) throw error

      setPrompts(prev => prev.map(p => 
        p.id === prompt.id ? updatedPrompt as Prompt : p
      ))

      toast({
        title: prompt.is_active ? 'Prompt desativado' : 'Prompt ativado',
        description: 'Status do prompt alterado com sucesso.',
      })
      
      return { data: updatedPrompt, error: null }
    } catch (error) {
      console.error('Erro ao alterar status do prompt:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do prompt.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Duplicar prompt
  const duplicatePrompt = async (prompt: Prompt) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para duplicar prompts.',
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

      setPrompts(prev => [duplicatedPrompt as Prompt, ...prev])
      toast({
        title: 'Prompt duplicado',
        description: 'Uma cópia do prompt foi criada e está inativa.',
      })
      
      return { data: duplicatedPrompt, error: null }
    } catch (error) {
      console.error('Erro ao duplicar prompt:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao duplicar prompt.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Remover prompt
  const deletePrompt = async (prompt: Prompt) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', prompt.id)

      if (error) throw error

      setPrompts(prev => prev.filter(p => p.id !== prompt.id))
      toast({
        title: 'Prompt removido',
        description: `O prompt "${prompt.name}" foi removido com sucesso.`,
      })
      
      return { error: null }
    } catch (error) {
      console.error('Erro ao remover prompt:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao remover prompt.',
        variant: 'destructive',
      })
      return { error }
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [])

  return {
    prompts,
    loading,
    createPrompt,
    updatePrompt,
    togglePromptActive,
    duplicatePrompt,
    deletePrompt,
    fetchPrompts
  }
}
