
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Prompt } from '@/types/prompt'
import { useToast } from '@/hooks/use-toast'
import { PROMPT_MESSAGES } from '@/utils/promptConstants'

export function useOptimizedPrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchPrompts = async () => {
    try {
      setLoading(true)
      console.log('Fetching prompts...')
      
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
        description: PROMPT_MESSAGES.ERROR.LOAD,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [])

  return {
    prompts,
    loading,
    fetchPrompts,
    setPrompts
  }
}
