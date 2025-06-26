
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/core/Logger'
import { errorHandler } from '@/core/ErrorHandler'
import { Prompt, PromptFormData } from '@/types/prompt'
import { usePromptActions } from '@/hooks/usePromptActions'

interface UseOptimizedPromptsResult {
  prompts: Prompt[]
  loading: boolean
  error: string | null
  refreshPrompts: () => Promise<void>
  totalCount: number
  setPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>
  fetchPrompts: () => Promise<void>
}

export function useOptimizedPrompts(): UseOptimizedPromptsResult {
  const { user } = useAuth()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchPrompts = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      logger.debug('Fetching prompts (user + global)', { userId: user.id })

      // Buscar prompts do usuário E prompts globais (user_id NULL)
      const { data, count, error: fetchError } = await supabase
        .from('prompts')
        .select('*', { count: 'exact' })
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      setPrompts(data || [])
      setTotalCount(count || 0)
      
      logger.debug('Prompts fetched successfully', { count: data?.length })
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'useOptimizedPrompts.fetchPrompts',
        showToast: true
      })
      setError(appError.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  return {
    prompts, // Retornando todos os prompts, não apenas os ativos
    loading,
    error,
    refreshPrompts: fetchPrompts,
    totalCount,
    setPrompts,
    fetchPrompts
  }
}
