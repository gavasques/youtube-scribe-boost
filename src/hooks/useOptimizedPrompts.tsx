
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/core/Logger'
import { errorHandler } from '@/core/ErrorHandler'

interface Prompt {
  id: string
  name: string
  content: string
  type: 'SUMMARY' | 'DESCRIPTION' | 'TAGS' | 'CUSTOM'
  model_name: string
  temperature: number
  max_tokens: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UseOptimizedPromptsResult {
  prompts: Prompt[]
  loading: boolean
  error: string | null
  refreshPrompts: () => Promise<void>
  totalCount: number
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
      if (!acc[prompt.type]) acc[prompt.type] = []
      acc[prompt.type].push(prompt)
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
    totalCount
  }
}
