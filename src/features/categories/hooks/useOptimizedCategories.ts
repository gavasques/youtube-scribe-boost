
// Move optimized categories hook to feature folder
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/core/Logger'
import { errorHandler } from '@/core/ErrorHandler'
import { Category, CategoryFormData } from '../types'
import { useCategoryActions } from './useCategoryActions'

interface UseOptimizedCategoriesResult {
  categories: Category[]
  loading: boolean
  error: string | null
  refreshCategories: () => Promise<void>
  totalCount: number
  activeCategories: Category[]
  fetchCategories: () => Promise<void>
  createCategory: (data: CategoryFormData) => Promise<{ data?: Category; error?: string }>
  updateCategory: (id: string, data: CategoryFormData) => Promise<{ data?: Category; error?: string }>
  deleteCategory: (category: Category) => Promise<{ error?: string }>
  toggleCategoryActive: (category: Category) => Promise<{ data?: Category; error?: string }>
  isActionLoading: boolean
}

export function useOptimizedCategories(): UseOptimizedCategoriesResult {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const { 
    createCategory: createCategoryAction,
    updateCategory: updateCategoryAction,
    deleteCategory: deleteCategoryAction,
    toggleCategoryActive: toggleCategoryActiveAction,
    isLoading: isActionLoading
  } = useCategoryActions()

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

  const createCategory = async (data: CategoryFormData) => {
    const result = await createCategoryAction(data)
    if (result.data) {
      await fetchCategories()
    }
    return result
  }

  const updateCategory = async (id: string, data: CategoryFormData) => {
    const result = await updateCategoryAction(id, data)
    if (result.data) {
      await fetchCategories()
    }
    return result
  }

  const deleteCategory = async (category: Category) => {
    const result = await deleteCategoryAction(category)
    if (!result.error) {
      await fetchCategories()
    }
    return result
  }

  const toggleCategoryActive = async (category: Category) => {
    const result = await toggleCategoryActiveAction(category)
    if (result.data) {
      await fetchCategories()
    }
    return result
  }

  // Memoize category options for forms
  const categoryOptions = useMemo(() => 
    categories.map(cat => ({
      value: cat.id,
      label: cat.name,
      color: undefined
    })), 
    [categories]
  )

  const activeCategories = useMemo(() => 
    categories.filter(cat => cat.is_active), 
    [categories]
  )

  return {
    categories,
    loading,
    error,
    refreshCategories: fetchCategories,
    totalCount,
    activeCategories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
    isActionLoading
  }
}
