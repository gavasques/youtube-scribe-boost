
import { useState, useEffect, useMemo } from 'react'
import { Category } from '@/types/category'
import { categoryService } from '@/services/categoryService'
import { useCategoryOperations } from '@/hooks/useCategoryOperations'
import { useToast } from '@/hooks/use-toast'

export function useOptimizedCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false) // Não carrega automaticamente
  const [hasLoaded, setHasLoaded] = useState(false)
  const { toast } = useToast()
  
  const operations = useCategoryOperations()

  // Cache para evitar refetch desnecessário
  const [lastFetch, setLastFetch] = useState<number>(0)
  const CACHE_DURATION = 60000 // 1 minuto para categorias

  // Lazy loading - buscar apenas quando necessário
  const fetchCategories = async (forceRefresh = false) => {
    try {
      const now = Date.now()
      
      // Verificar cache
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
        description: 'Erro ao carregar categorias.',
        variant: 'destructive',
      })
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  // Memoizar categorias ativas
  const activeCategories = useMemo(() => {
    return categories.filter(cat => cat.is_active)
  }, [categories])

  // Wrapper functions que atualizam estado local
  const createCategory = async (data: any) => {
    const result = await operations.createCategory(data)
    if (result.data) {
      setCategories(prev => [...prev, result.data])
    }
    return result
  }

  const updateCategory = async (id: string, data: any) => {
    const result = await operations.updateCategory(id, data)
    if (result.data) {
      setCategories(prev => prev.map(c => c.id === id ? result.data : c))
    }
    return result
  }

  const toggleCategoryActive = async (category: Category) => {
    const result = await operations.toggleCategoryActive(category)
    if (result.data) {
      setCategories(prev => prev.map(c => 
        c.id === category.id ? result.data : c
      ))
    }
    return result
  }

  const deleteCategory = async (category: Category) => {
    const result = await operations.deleteCategory(category)
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
    fetchCategories
  }
}
