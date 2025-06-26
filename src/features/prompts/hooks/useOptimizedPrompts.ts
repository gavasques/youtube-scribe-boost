
// Move optimized prompts hook to feature folder
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/core/Logger'
import { errorHandler } from '@/core/ErrorHandler'
import { Prompt, PromptFormData } from '../types'
import { usePromptActions } from './usePromptActions'

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

      logger.debug('Fetching optimized prompts', { userId: user.id })

      const { data, count, error: fetchError } = await supabase
        .from('prompts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
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

  // Memoize prompts by type
  const promptsByType = useMemo(() => {
    const grouped = prompts.reduce((acc, prompt) => {
      const key = 'CUSTOM' // Default type since type doesn't exist in our schema
      if (!acc[key]) acc[key] = []
      acc[key].push(prompt)
      return acc
    }, {} as Record<string, Prompt[]>)
    return grouped
  }, [prompts])

  const activePrompts = useMemo(() => 
    prompts.filter(prompt => prompt.is_active), 
    [prompts]
  )

  return {
    prompts: activePrompts,
    loading,
    error,
    refreshPrompts: fetchPrompts,
    totalCount,
    setPrompts,
    fetchPrompts
  }
}
