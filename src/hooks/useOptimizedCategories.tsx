
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/core/Logger'
import { errorHandler } from '@/core/ErrorHandler'

interface Category {
  id: string
  name: string
  description?: string
  color_hex?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UseOptimizedCategoriesResult {
  categories: Category[]
  loading: boolean
  error: string | null
  refreshCategories: () => Promise<void>
  totalCount: number
}

export function useOptimizedCategories(): UseOptimizedCategoriesResult {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchCategories = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      logger.debug('Fetching optimized categories', { userId: user.id })

      const { data, count, error: fetchError } = await supabase
        .from('categories')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      setCategories(data || [])
      setTotalCount(count || 0)
      
      logger.debug('Categories fetched successfully', { count: data?.length })
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'useOptimizedCategories.fetchCategories',
        showToast: true
      })
      setError(appError.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Memoize category options for forms
  const categoryOptions = useMemo(() => 
    categories.map(cat => ({
      value: cat.id,
      label: cat.name,
      color: cat.color_hex
    })), 
    [categories]
  )

  return {
    categories,
    loading,
    error,
    refreshCategories: fetchCategories,
    totalCount
  }
}
