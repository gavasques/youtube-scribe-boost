
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Block, BlockFormData } from '@/types/block'
import { useToast } from '@/hooks/use-toast'

export function useBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Buscar blocos do usuário
  const fetchBlocks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .order('priority', { ascending: false })

      if (error) throw error
      
      setBlocks((data || []) as Block[])
    } catch (error) {
      console.error('Erro ao buscar blocos:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar blocos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Criar novo bloco
  const createBlock = async (data: BlockFormData) => {
    try {
      const { data: newBlock, error } = await supabase
        .from('blocks')
        .insert([{
          ...data,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

      if (error) throw error

      setBlocks(prev => [newBlock as Block, ...prev])
      toast({
        title: 'Bloco criado',
        description: 'O bloco foi criado com sucesso.',
      })
      
      return { data: newBlock, error: null }
    } catch (error) {
      console.error('Erro ao criar bloco:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar bloco.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Atualizar bloco
  const updateBlock = async (id: string, data: BlockFormData) => {
    try {
      const { data: updatedBlock, error } = await supabase
        .from('blocks')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setBlocks(prev => prev.map(b => b.id === id ? updatedBlock as Block : b))
      toast({
        title: 'Bloco atualizado',
        description: 'O bloco foi atualizado com sucesso.',
      })
      
      return { data: updatedBlock, error: null }
    } catch (error) {
      console.error('Erro ao atualizar bloco:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar bloco.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Ativar/desativar bloco
  const toggleBlockActive = async (block: Block) => {
    try {
      const { data: updatedBlock, error } = await supabase
        .from('blocks')
        .update({ is_active: !block.is_active })
        .eq('id', block.id)
        .select()
        .single()

      if (error) throw error

      setBlocks(prev => prev.map(b => 
        b.id === block.id ? updatedBlock as Block : b
      ))

      toast({
        title: block.is_active ? 'Bloco desativado' : 'Bloco ativado',
        description: `O bloco "${block.title}" foi ${block.is_active ? 'desativado' : 'ativado'}.`,
      })
      
      return { data: updatedBlock, error: null }
    } catch (error) {
      console.error('Erro ao alterar status do bloco:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do bloco.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Duplicar bloco
  const duplicateBlock = async (block: Block) => {
    try {
      const { data: duplicatedBlock, error } = await supabase
        .from('blocks')
        .insert([{
          title: `${block.title} (Cópia)`,
          description: block.description,
          content: block.content,
          type: block.type,
          scope: block.scope,
          priority: block.priority,
          is_active: false,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

      if (error) throw error

      setBlocks(prev => [duplicatedBlock as Block, ...prev])
      toast({
        title: 'Bloco duplicado',
        description: 'Uma cópia do bloco foi criada e está inativa.',
      })
      
      return { data: duplicatedBlock, error: null }
    } catch (error) {
      console.error('Erro ao duplicar bloco:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao duplicar bloco.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Remover bloco
  const deleteBlock = async (block: Block) => {
    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', block.id)

      if (error) throw error

      setBlocks(prev => prev.filter(b => b.id !== block.id))
      toast({
        title: 'Bloco removido',
        description: `O bloco "${block.title}" foi removido com sucesso.`,
      })
      
      return { error: null }
    } catch (error) {
      console.error('Erro ao remover bloco:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao remover bloco.',
        variant: 'destructive',
      })
      return { error }
    }
  }

  useEffect(() => {
    fetchBlocks()
  }, [])

  return {
    blocks,
    loading,
    createBlock,
    updateBlock,
    toggleBlockActive,
    duplicateBlock,
    deleteBlock,
    fetchBlocks
  }
}
