
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
      
      // Primeiro, verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      console.log('🔍 Estado de autenticação:', { 
        userId: user?.id, 
        email: user?.email,
        authError 
      })
      
      if (authError) {
        console.error('❌ Erro de autenticação:', authError)
        throw authError
      }

      if (!user) {
        console.warn('⚠️ Usuário não autenticado')
        setCategories([])
        return
      }

      console.log('📋 Buscando categorias para o usuário:', user.id)

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      console.log('📊 Resultado da busca de categorias:', { 
        data, 
        error,
        count: data?.length || 0
      })
      
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
      console.log('🚀 Iniciando criação de categoria:', data)
      
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        console.error('❌ Usuário não autenticado para criar categoria')
        throw new Error('Usuário não autenticado')
      }

      console.log('👤 Usuário autenticado, criando categoria para:', user.user.id)

      const categoryData = {
        ...data,
        user_id: user.user.id
      }

      console.log('📝 Dados da categoria a serem inseridos:', categoryData)

      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single()

      console.log('✅ Resultado da inserção:', { newCategory, error })

      if (error) {
        console.error('❌ Erro na inserção:', error)
        
        // Tratamento específico para foreign key constraint
        if (error.code === '23503' && error.message.includes('foreign key constraint')) {
          console.error('🔗 Erro de foreign key constraint detectado')
          toast({
            title: 'Erro de configuração',
            description: 'Problema de configuração do banco de dados. Tentando novamente...',
            variant: 'destructive',
          })
        }
        
        throw error
      }

      setCategories(prev => [...prev, newCategory as Category])
      toast({
        title: 'Categoria criada',
        description: 'A categoria foi criada com sucesso.',
      })
      
      console.log('🎉 Categoria criada com sucesso:', newCategory)
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
    console.log('🔄 useCategories: Inicializando busca de categorias')
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
