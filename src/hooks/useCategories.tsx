
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Category, CategoryFormData } from '@/types/category'
import { useToast } from '@/hooks/use-toast'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Buscar categorias do usuário
  const fetchCategories = async () => {
    try {
      setLoading(true)
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Erro de autenticação:', authError)
        throw authError
      }

      if (!user) {
        console.warn('⚠️ Usuário não autenticado')
        setCategories([])
        return
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
      
      if (error) {
        console.error('❌ Erro ao buscar categorias:', error)
        throw error
      }
      
      setCategories((data || []) as Category[])
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

  // Criar nova categoria
  const createCategory = async (data: CategoryFormData) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        throw new Error('Usuário não autenticado')
      }

      const categoryData = {
        ...data,
        user_id: user.user.id
      }

      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single()

      if (error) {
        throw error
      }

      setCategories(prev => [...prev, newCategory as Category])
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
      const { data: updatedCategory, error } = await supabase
        .from('categories')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setCategories(prev => prev.map(c => c.id === id ? updatedCategory as Category : c))
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
      const { data: updatedCategory, error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)
        .select()
        .single()

      if (error) throw error

      setCategories(prev => prev.map(c => 
        c.id === category.id ? updatedCategory as Category : c
      ))

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
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)

      if (error) throw error

      setCategories(prev => prev.filter(c => c.id !== category.id))
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
