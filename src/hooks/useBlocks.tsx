import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Block, BlockFormData } from '@/types/block'
import { useToast } from '@/hooks/use-toast'

export function useBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Buscar blocos do usuário - ordenados por data de criação (mais recente primeiro)
  const fetchBlocks = async () => {
    try {
      setLoading(true)
      
      // Verificar se o usuário está autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Erro ao obter usuário:', userError)
        throw userError
      }

      if (!user) {
        console.log('Usuário não autenticado')
        setBlocks([])
        return
      }

      console.log('Buscando blocos para usuário:', user.id)

      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro na query de blocos:', error)
        throw error
      }
      
      console.log('Blocos encontrados:', data)
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
      console.log('Criando bloco com dados:', data)
      
      // Obter usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado')
      }

      // Preparar dados para inserção
      const blockData = {
        title: data.title,
        content: data.content,
        type: data.type,
        scope: data.scope,
        priority: data.priority || 0,
        is_active: data.is_active !== false,
        scheduled_start: data.scheduled_start || null,
        scheduled_end: data.scheduled_end || null,
        user_id: user.id
      }

      console.log('Dados preparados para inserção:', blockData)

      const { data: newBlock, error } = await supabase
        .from('blocks')
        .insert([blockData])
        .select()
        .single()

      if (error) {
        console.error('Erro ao inserir bloco:', error)
        throw error
      }

      console.log('Bloco criado com sucesso:', newBlock)
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
        description: error instanceof Error ? error.message : 'Erro ao criar bloco.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Atualizar bloco
  const updateBlock = async (id: string, data: BlockFormData) => {
    try {
      const updateData = {
        title: data.title,
        content: data.content,
        type: data.type,
        scope: data.scope,
        priority: data.priority || 0,
        is_active: data.is_active !== false,
        scheduled_start: data.scheduled_start || null,
        scheduled_end: data.scheduled_end || null,
        updated_at: new Date().toISOString()
      }

      const { data: updatedBlock, error } = await supabase
        .from('blocks')
        .update(updateData)
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

  // Mover bloco para cima na ordem
  const moveBlockUp = async (blockId: string) => {
    try {
      const currentIndex = blocks.findIndex(b => b.id === blockId)
      if (currentIndex <= 0) return

      const currentBlock = blocks[currentIndex]
      const previousBlock = blocks[currentIndex - 1]
      
      // Ajustar created_at para simular reordenação
      const newCreatedAt = new Date(new Date(previousBlock.created_at).getTime() + 1000).toISOString()

      const { error } = await supabase
        .from('blocks')
        .update({ created_at: newCreatedAt })
        .eq('id', blockId)

      if (error) throw error

      // Recarregar lista
      await fetchBlocks()
      
      toast({
        title: 'Bloco movido',
        description: 'O bloco foi movido para cima.',
      })
    } catch (error) {
      console.error('Erro ao mover bloco:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao mover bloco.',
        variant: 'destructive',
      })
    }
  }

  // Mover bloco para baixo na ordem
  const moveBlockDown = async (blockId: string) => {
    try {
      const currentIndex = blocks.findIndex(b => b.id === blockId)
      if (currentIndex >= blocks.length - 1) return

      const currentBlock = blocks[currentIndex]
      const nextBlock = blocks[currentIndex + 1]
      
      // Ajustar created_at para simular reordenação
      const newCreatedAt = new Date(new Date(nextBlock.created_at).getTime() - 1000).toISOString()

      const { error } = await supabase
        .from('blocks')
        .update({ created_at: newCreatedAt })
        .eq('id', blockId)

      if (error) throw error

      // Recarregar lista
      await fetchBlocks()
      
      toast({
        title: 'Bloco movido',
        description: 'O bloco foi movido para baixo.',
      })
    } catch (error) {
      console.error('Erro ao mover bloco:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao mover bloco.',
        variant: 'destructive',
      })
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: duplicatedBlock, error } = await supabase
        .from('blocks')
        .insert([{
          title: `${block.title} (Cópia)`,
          content: block.content,
          type: block.type,
          scope: block.scope,
          priority: block.priority,
          is_active: false,
          user_id: user.id
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
    moveBlockUp,
    moveBlockDown,
    fetchBlocks
  }
}
