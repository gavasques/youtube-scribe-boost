
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Category, CategoryFormData } from '@/types/category'
import { categoryService } from '@/services/categoryService'

export function useCategoryOperations() {
  const { toast } = useToast()

  // Criar nova categoria
  const createCategory = async (data: CategoryFormData) => {
    try {
      const newCategory = await categoryService.createCategory(data)
      
      toast({
        title: 'Categoria criada',
        description: 'A categoria foi criada com sucesso.',
      })
      
      return { data: newCategory, error: null }
    } catch (error) {
      console.error('💥 Erro ao criar categoria:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar categoria.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Atualizar categoria
  const updateCategory = async (id: string, data: CategoryFormData) => {
    try {
      const updatedCategory = await categoryService.updateCategory(id, data)
      
      toast({
        title: 'Categoria atualizada',
        description: 'A categoria foi atualizada com sucesso.',
      })
      
      return { data: updatedCategory, error: null }
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar categoria.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Ativar/desativar categoria
  const toggleCategoryActive = async (category: Category) => {
    try {
      const updatedCategory = await categoryService.toggleCategoryActive(category)

      toast({
        title: category.is_active ? 'Categoria desativada' : 'Categoria ativada',
        description: `A categoria "${category.name}" foi ${category.is_active ? 'desativada' : 'ativada'}.`,
      })
      
      return { data: updatedCategory, error: null }
    } catch (error) {
      console.error('Erro ao alterar status da categoria:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status da categoria.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Remover categoria
  const deleteCategory = async (category: Category) => {
    try {
      await categoryService.deleteCategory(category.id)
      
      toast({
        title: 'Categoria removida',
        description: `A categoria "${category.name}" foi removida com sucesso.`,
      })
      
      return { error: null }
    } catch (error) {
      console.error('Erro ao remover categoria:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao remover categoria.',
        variant: 'destructive',
      })
      return { error }
    }
  }

  return {
    createCategory,
    updateCategory,
    toggleCategoryActive,
    deleteCategory
  }
}
