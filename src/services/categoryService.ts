
import { supabase } from '@/integrations/supabase/client'
import { Category, CategoryFormData } from '@/types/category'

export const categoryService = {
  // Buscar categorias do usuário
  async fetchCategories(): Promise<Category[]> {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError)
      throw authError
    }

    if (!user) {
      console.warn('⚠️ Usuário não autenticado')
      return []
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
    
    return (data || []) as Category[]
  },

  // Criar nova categoria
  async createCategory(data: CategoryFormData): Promise<Category> {
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

    return newCategory as Category
  },

  // Atualizar categoria
  async updateCategory(id: string, data: CategoryFormData): Promise<Category> {
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

    return updatedCategory as Category
  },

  // Ativar/desativar categoria
  async toggleCategoryActive(category: Category): Promise<Category> {
    const { data: updatedCategory, error } = await supabase
      .from('categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)
      .select()
      .single()

    if (error) throw error

    return updatedCategory as Category
  },

  // Remover categoria
  async deleteCategory(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) throw error
  }
}
