
import { useState, useEffect, useMemo } from 'react'
import { Category } from '@/types/category'
import { categoryService } from '@/services/categoryService'
import { useCategoryActions } from '@/hooks/useCategoryActions'
import { useToast } from '@/hooks/use-toast'
import { CATEGORY_MESSAGES } from '@/utils/categoryConstants'

export function useOptimizedCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const { toast } = useToast()
  
  const actions = useCategoryActions()

  // Cache para evitar refetch desnecessário
  const [lastFetch, setLastFetch] = useState<number>(0)
  const CACHE_DURATION = 60000 // 1 minuto

  // Buscar categorias
  const fetchCategories = async (forceRefresh = false) => {
    try {
      const now = Date.now()
      
      // Verificar cache apenas se já carregou uma vez
      if (!forceRefresh && hasLoaded && now - lastFetch < CACHE_DURATION) {
        return
      }

      setLoading(true)
      const data = await categoryService.fetchCategories()
      setCategories(data)
      setHasLoaded(true)
      setLastFetch(now)
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      toast({
        title: 'Erro',
        description: CATEGORY_MESSAGES.ERRORS.LOAD,
        variant: 'destructive',
      })
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  // Carregar categorias na inicialização
  useEffect(() => {
    fetchCategories()
  }, [])

  // Memoizar categorias ativas
  const activeCategories = useMemo(() => {
    return categories.filter(cat => cat.is_active)
  }, [categories])

  // Wrapper functions que atualizam estado local
  const createCategory = async (data: any) => {
    const result = await actions.createCategory(data)
    if (result.data) {
      setCategories(prev => [...prev, result.data])
    }
    return result
  }

  const updateCategory = async (id: string, data: any) => {
    const result = await actions.updateCategory(id, data)
    if (result.data) {
      setCategories(prev => prev.map(c => c.id === id ? result.data : c))
    }
    return result
  }

  const toggleCategoryActive = async (category: Category) => {
    const result = await actions.toggleCategoryActive(category)
    if (result.data) {
      setCategories(prev => prev.map(c => 
        c.id === category.id ? result.data : c
      ))
    }
    return result
  }

  const deleteCategory = async (category: Category) => {
    const result = await actions.deleteCategory(category)
    if (!result.error) {
      setCategories(prev => prev.filter(c => c.id !== category.id))
    }
    return result
  }

  return {
    categories,
    activeCategories,
    loading,
    hasLoaded,
    createCategory,
    updateCategory,
    toggleCategoryActive,
    deleteCategory,
    fetchCategories,
    isActionLoading: actions.isLoading
  }
}
