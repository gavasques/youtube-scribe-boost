
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Block, BlockFormData } from '@/types/block'
import { useToast } from '@/hooks/use-toast'

export function useOptimizedBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const { toast } = useToast()

  // Cache para evitar refetch desnecessário
  const [lastFetch, setLastFetch] = useState<number>(0)
  const CACHE_DURATION = 30000 // 30 segundos

  // Buscar blocos de forma otimizada - sem JOIN com videos quando não necessário
  const fetchBlocks = async (forceRefresh = false) => {
    try {
      const now = Date.now()
      
      // Verificar cache
      if (!forceRefresh && now - lastFetch < CACHE_DURATION && blocks.length > 0) {
        return
      }

      setLoading(true)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setBlocks([])
        return
      }

      // Garantir bloco Manual apenas uma vez na inicialização
      if (!initialized) {
        await supabase.rpc('ensure_manual_block_exists', {
          p_user_id: user.id
        })
        setInitialized(true)
      }

      // Query otimizada - buscar apenas dados necessários
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro na query de blocos:', error)
        throw error
      }
      
      setBlocks((data || []) as Block[])
      setLastFetch(now)
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

  // Operações CRUD otimizadas
  const createBlock = async (data: BlockFormData) => {
    try {
      if (data.type === 'MANUAL') {
        throw new Error('Blocos do tipo MANUAL são criados automaticamente pelo sistema')
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Usuário não autenticado')
      }

      const blockData = {
        title: data.title,
        content: data.content,
        type: data.type,
        scope: data.scope,
        priority: data.priority || 0,
        is_active: data.is_active !== false,
        scheduled_start: data.scheduled_start || null,
        scheduled_end: data.scheduled_end || null,
        video_id: null,
        user_id: user.id
      }

      const { data: newBlock, error } = await supabase
        .from('blocks')
        .insert([blockData])
        .select()
        .single()

      if (error) throw error

      // Atualizar estado local diretamente para UX mais rápida
      setBlocks(prev => [...prev, newBlock as Block])
      
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

  const updateBlock = async (id: string, data: BlockFormData) => {
    try {
      const blockToUpdate = blocks.find(b => b.id === id)
      if (blockToUpdate?.type === 'MANUAL') {
        throw new Error('O bloco "Descrições dos Vídeos" não pode ser editado.')
      }

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

      // Atualizar estado local
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
        description: error instanceof Error ? error.message : 'Erro ao atualizar bloco.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  const toggleBlockActive = async (block: Block) => {
    try {
      if (block.type === 'MANUAL') {
        throw new Error('O bloco "Descrições dos Vídeos" está sempre ativo.')
      }

      const { data: updatedBlock, error } = await supabase
        .from('blocks')
        .update({ is_active: !block.is_active })
        .eq('id', block.id)
        .select()
        .single()

      if (error) throw error

      // Atualizar estado local
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
        description: error instanceof Error ? error.message : 'Erro ao alterar status do bloco.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  const deleteBlock = async (block: Block) => {
    try {
      if (block.type === 'MANUAL') {
        throw new Error('O bloco "Descrições dos Vídeos" não pode ser removido.')
      }

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', block.id)

      if (error) throw error

      // Atualizar estado local
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
        description: error instanceof Error ? error.message : 'Erro ao remover bloco.',
        variant: 'destructive',
      })
      return { error }
    }
  }

  const moveBlockUp = async (blockId: string) => {
    try {
      const currentBlockIndex = blocks.findIndex(b => b.id === blockId)
      if (currentBlockIndex <= 0) return

      const currentBlock = blocks[currentBlockIndex]
      const blockAbove = blocks[currentBlockIndex - 1]

      // Atualizar estado local primeiro para UX suave
      const updatedBlocks = [...blocks]
      updatedBlocks[currentBlockIndex] = { ...currentBlock, priority: blockAbove.priority }
      updatedBlocks[currentBlockIndex - 1] = { ...blockAbove, priority: currentBlock.priority }
      
      setBlocks(updatedBlocks)

      // Atualizar no banco em background
      await Promise.all([
        supabase.from('blocks').update({ priority: blockAbove.priority }).eq('id', currentBlock.id),
        supabase.from('blocks').update({ priority: currentBlock.priority }).eq('id', blockAbove.id)
      ])
      
      toast({
        title: 'Bloco movido',
        description: 'O bloco foi movido para cima.',
      })
    } catch (error) {
      console.error('Erro ao mover bloco:', error)
      // Reverter em caso de erro
      await fetchBlocks(true)
      toast({
        title: 'Erro',
        description: 'Erro ao mover bloco.',
        variant: 'destructive',
      })
    }
  }

  const moveBlockDown = async (blockId: string) => {
    try {
      const currentBlockIndex = blocks.findIndex(b => b.id === blockId)
      if (currentBlockIndex >= blocks.length - 1) return

      const currentBlock = blocks[currentBlockIndex]
      const blockBelow = blocks[currentBlockIndex + 1]

      // Atualizar estado local primeiro para UX suave
      const updatedBlocks = [...blocks]
      updatedBlocks[currentBlockIndex] = { ...currentBlock, priority: blockBelow.priority }
      updatedBlocks[currentBlockIndex + 1] = { ...blockBelow, priority: currentBlock.priority }
      
      setBlocks(updatedBlocks)

      // Atualizar no banco em background
      await Promise.all([
        supabase.from('blocks').update({ priority: blockBelow.priority }).eq('id', currentBlock.id),
        supabase.from('blocks').update({ priority: currentBlock.priority }).eq('id', blockBelow.id)
      ])
      
      toast({
        title: 'Bloco movido',
        description: 'O bloco foi movido para baixo.',
      })
    } catch (error) {
      console.error('Erro ao mover bloco:', error)
      // Reverter em caso de erro
      await fetchBlocks(true)
      toast({
        title: 'Erro',
        description: 'Erro ao mover bloco.',
        variant: 'destructive',
      })
    }
  }

  // Memoizar dados processados para evitar recálculos
  const convertedBlocks = useMemo(() => {
    return blocks.map(block => ({
      id: block.id,
      title: block.title,
      content: block.content,
      type: block.type as 'GLOBAL' | 'CATEGORY' | 'MANUAL',
      scope: block.scope as 'PERMANENT' | 'SCHEDULED',
      priority: block.priority,
      isActive: block.is_active,
      scheduledStart: block.scheduled_start || undefined,
      scheduledEnd: block.scheduled_end || undefined,
      categories: [],
      createdAt: block.created_at,
      videoId: block.video_id || undefined,
      videoTitle: undefined,
      videoDescription: undefined
    }))
  }, [blocks])

  useEffect(() => {
    fetchBlocks()
  }, [])

  return {
    blocks: convertedBlocks,
    loading,
    createBlock,
    updateBlock,
    toggleBlockActive,
    deleteBlock,
    moveBlockUp,
    moveBlockDown,
    fetchBlocks: () => fetchBlocks(true)
  }
}
