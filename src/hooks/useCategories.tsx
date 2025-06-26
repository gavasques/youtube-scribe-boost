
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Category, CategoryFormData } from '@/types/category'
import { useToast } from '@/hooks/use-toast'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Inserir categorias iniciais se não existirem
  const insertInitialCategories = async () => {
    try {
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id')
        .limit(1)

      if (existingCategories && existingCategories.length === 0) {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) return

        // Inserir categorias principais
        const { data: mainCategories, error: mainError } = await supabase
          .from('categories')
          .insert([
            {
              user_id: user.user.id,
              name: 'Importação',
              description: 'Vídeos sobre importação de produtos',
              icon: 'package',
              color: '#f97316',
              parent_id: null,
              is_active: true
            },
            {
              user_id: user.user.id,
              name: 'Internacionalização',
              description: 'Expansão internacional de negócios',
              icon: 'globe',
              color: '#22c55e',
              parent_id: null,
              is_active: true
            },
            {
              user_id: user.user.id,
              name: 'Amazon',
              description: 'Vendas na plataforma Amazon',
              icon: 'shopping-cart',
              color: '#3b82f6',
              parent_id: null,
              is_active: true
            },
            {
              user_id: user.user.id,
              name: 'Sem Categoria',
              description: 'Vídeos não categorizados',
              icon: 'folder',
              color: '#6b7280',
              parent_id: null,
              is_active: true
            }
          ])
          .select()

        if (mainError) throw mainError

        // Encontrar IDs das categorias principais
        const amazonCategory = mainCategories?.find(cat => cat.name === 'Amazon')
        const importacaoCategory = mainCategories?.find(cat => cat.name === 'Importação')

        // Inserir subcategorias
        if (amazonCategory && importacaoCategory) {
          const { error: subError } = await supabase
            .from('categories')
            .insert([
              {
                user_id: user.user.id,
                name: 'FBA',
                description: 'Fulfillment by Amazon',
                icon: 'shopping-cart',
                color: '#3b82f6',
                parent_id: amazonCategory.id,
                is_active: true
              },
              {
                user_id: user.user.id,
                name: 'PPC',
                description: 'Anúncios pagos Amazon',
                icon: 'shopping-cart',
                color: '#3b82f6',
                parent_id: amazonCategory.id,
                is_active: true
              },
              {
                user_id: user.user.id,
                name: 'AliExpress',
                description: 'Importação via AliExpress',
                icon: 'package',
                color: '#f97316',
                parent_id: importacaoCategory.id,
                is_active: true
              }
            ])

          if (subError) throw subError
        }

        console.log('Categorias iniciais inseridas com sucesso')
      }
    } catch (error) {
      console.error('Erro ao inserir categorias iniciais:', error)
    }
  }

  // Buscar categorias do usuário
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      
      setCategories((data || []) as Category[])
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar categorias.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Criar nova categoria
  const createCategory = async (data: CategoryFormData) => {
    try {
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert([{
          ...data,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

      if (error) throw error

      setCategories(prev => [...prev, newCategory as Category])
      toast({
        title: 'Categoria criada',
        description: 'A categoria foi criada com sucesso.',
      })
      
      return { data: newCategory, error: null }
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
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
    const initializeCategories = async () => {
      await insertInitialCategories()
      await fetchCategories()
    }
    
    initializeCategories()
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
