
import { useState, useEffect } from 'react'
import { Category } from '@/types/category'
import { categoryService } from '@/services/categoryService'
import { useCategoryOperations } from '@/hooks/useCategoryOperations'
import { useToast } from '@/hooks/use-toast'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  const operations = useCategoryOperations()

  // Buscar categorias do usuário
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await categoryService.fetchCategories()
      setCategories(data)
    } catch (error) {
      console.error('💥 Erro geral ao buscar categorias:', error)
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

  // Wrapper functions that update local state
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

  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    toggleCategoryActive,
    deleteCategory,
    fetchCategories
  }
}
