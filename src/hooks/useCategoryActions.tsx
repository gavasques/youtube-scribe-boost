
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Category, CategoryFormData } from '@/types/category'
import { categoryService } from '@/services/categoryService'
import { CATEGORY_MESSAGES } from '@/utils/categoryConstants'
import { formatToggleMessage, formatDeleteMessage } from '@/utils/categoryFormatters'

export function useCategoryActions() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const createCategory = async (data: CategoryFormData) => {
    setIsLoading(true)
    try {
      const newCategory = await categoryService.createCategory(data)
      
      toast({
        title: CATEGORY_MESSAGES.CREATED,
        description: `Categoria "${newCategory.name}" criada.`,
      })
      
      return { data: newCategory, error: null }
    } catch (error) {
      console.error('💥 Erro ao criar categoria:', error)
      toast({
        title: 'Erro',
        description: CATEGORY_MESSAGES.ERRORS.CREATE,
        variant: 'destructive',
      })
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }

  const updateCategory = async (id: string, data: CategoryFormData) => {
    setIsLoading(true)
    try {
      const updatedCategory = await categoryService.updateCategory(id, data)
      
      toast({
        title: CATEGORY_MESSAGES.UPDATED,
        description: `Categoria "${updatedCategory.name}" atualizada.`,
      })
      
      return { data: updatedCategory, error: null }
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error)
      toast({
        title: 'Erro',
        description: CATEGORY_MESSAGES.ERRORS.UPDATE,
        variant: 'destructive',
      })
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategoryActive = async (category: Category) => {
    setIsLoading(true)
    try {
      const updatedCategory = await categoryService.toggleCategoryActive(category)

      toast({
        title: category.is_active ? CATEGORY_MESSAGES.DEACTIVATED : CATEGORY_MESSAGES.ACTIVATED,
        description: formatToggleMessage(category),
      })
      
      return { data: updatedCategory, error: null }
    } catch (error) {
      console.error('Erro ao alterar status da categoria:', error)
      toast({
        title: 'Erro',
        description: CATEGORY_MESSAGES.ERRORS.TOGGLE,
        variant: 'destructive',
      })
      return { data: null, error }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCategory = async (category: Category) => {
    setIsLoading(true)
    try {
      await categoryService.deleteCategory(category.id)
      
      toast({
        title: CATEGORY_MESSAGES.DELETED,
        description: formatDeleteMessage(category.name),
      })
      
      return { error: null }
    } catch (error) {
      console.error('Erro ao remover categoria:', error)
      toast({
        title: 'Erro',
        description: CATEGORY_MESSAGES.ERRORS.DELETE,
        variant: 'destructive',
      })
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createCategory,
    updateCategory,
    toggleCategoryActive,
    deleteCategory,
    isLoading
  }
}
