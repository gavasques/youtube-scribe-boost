
// Move category actions hook to feature folder  
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/core/Logger'
import { errorHandler } from '@/core/ErrorHandler'
import { Category, CategoryFormData } from '../types'

export function useCategoryActions() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const showSuccess = (message: string) => {
    toast({ title: message })
  }

  const showError = (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: 'destructive'
    })
  }

  const createCategory = async (data: CategoryFormData): Promise<{ data?: Category; error?: string }> => {
    if (!user?.id) {
      return { error: 'Usuário não autenticado' }
    }

    setIsLoading(true)
    try {
      logger.debug('Creating category', { data })

      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description || null,
          is_active: data.is_active ?? true
        })
        .select()
        .single()

      if (error) throw error

      showSuccess('Categoria criada com sucesso')
      return { data: category }
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'useCategoryActions.createCategory',
        showToast: false
      })
      showError('Erro ao criar categoria', appError.message)
      return { error: appError.message }
    } finally {
      setIsLoading(false)
    }
  }

  const updateCategory = async (id: string, data: CategoryFormData): Promise<{ data?: Category; error?: string }> => {
    setIsLoading(true)
    try {
      logger.debug('Updating category', { id, data })

      const { data: category, error } = await supabase
        .from('categories')
        .update({
          name: data.name,
          description: data.description || null,
          is_active: data.is_active ?? true
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      showSuccess('Categoria atualizada com sucesso')
      return { data: category }
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'useCategoryActions.updateCategory',
        showToast: false
      })
      showError('Erro ao atualizar categoria', appError.message)
      return { error: appError.message }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCategory = async (category: Category): Promise<{ error?: string }> => {
    setIsLoading(true)
    try {
      logger.debug('Deleting category', { categoryId: category.id })

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)

      if (error) throw error

      showSuccess(`Categoria "${category.name}" foi removida`)
      return {}
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'useCategoryActions.deleteCategory',
        showToast: false
      })
      showError('Erro ao remover categoria', appError.message)
      return { error: appError.message }
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategoryActive = async (category: Category): Promise<{ data?: Category; error?: string }> => {
    setIsLoading(true)
    try {
      logger.debug('Toggling category active status', { categoryId: category.id, currentStatus: category.is_active })

      const { data: updatedCategory, error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)
        .select()
        .single()

      if (error) throw error

      const action = updatedCategory.is_active ? 'ativada' : 'desativada'
      showSuccess(`Categoria "${category.name}" foi ${action}`)
      return { data: updatedCategory }
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'useCategoryActions.toggleCategoryActive',
        showToast: false
      })
      showError('Erro ao alterar status da categoria', appError.message)
      return { error: appError.message }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
    isLoading
  }
}
