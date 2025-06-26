import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Block, BlockFormData } from '@/types/block'
import { useToast } from '@/hooks/use-toast'

export function useBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Garantir que existe um bloco Manual para o usuário
  const ensureManualBlockExists = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.log('Usuário não autenticado')
        return
      }

      const { data, error } = await supabase.rpc('ensure_manual_block_exists', {
        p_user_id: user.id
      })

      if (error) {
        console.error('Erro ao garantir bloco Manual:', error)
      } else {
        console.log('Bloco Manual garantido:', data)
      }
    } catch (error) {
      console.error('Erro na função ensureManualBlockExists:', error)
    }
  }

  // Reorganizar prioridades sequenciais
  const reorganizePriorities = (blocksToReorganize: Block[]) => {
    // Ordenar por prioridade atual (menor primeiro para manter a ordem visual)
    const sortedBlocks = [...blocksToReorganize].sort((a, b) => b.priority - a.priority)
    
    // Reassignar prioridades sequenciais
    return sortedBlocks.map((block, index) => ({
      ...block,
      priority: sortedBlocks.length - index // Inverte: primeiro bloco tem prioridade mais alta
    }))
  }

  // Reorganizar prioridades sequenciais no banco
  const updatePrioritiesInDatabase = async (blocksToUpdate: Block[]) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.log('Usuário não autenticado')
        return
      }

      // Atualizar em lote no banco
      for (const block of blocksToUpdate) {
        await supabase
          .from('blocks')
          .update({ priority: block.priority })
          .eq('id', block.id)
      }

      console.log('Prioridades atualizadas no banco:', blocksToUpdate.map(b => ({ id: b.id, priority: b.priority })))
    } catch (error) {
      console.error('Erro ao atualizar prioridades no banco:', error)
      throw error
    }
  }

  // Buscar blocos do usuário - ordenados por prioridade (menor primeiro) e depois por data
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

      // Garantir que existe bloco Manual
      await ensureManualBlockExists()

      const { data, error } = await supabase
        .from('blocks')
        .select(`
          *,
          videos!blocks_video_id_fkey (
            id,
            title,
            current_description,
            ai_description
          )
        `)
        .eq('user_id', user.id)
        .order('priority', { ascending: true })
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

  // Criar novo bloco (não permite criar blocos MANUAL diretamente)
  const createBlock = async (data: BlockFormData) => {
    try {
      console.log('Criando bloco com dados:', data)
      
      // Verificar se está tentando criar um bloco MANUAL
      if (data.type === 'MANUAL') {
        throw new Error('Blocos do tipo MANUAL são criados automaticamente pelo sistema')
      }
      
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
        video_id: null, // Sempre null para novos blocos
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
      
      // Recarregar lista completa para garantir ordem correta
      await fetchBlocks()
      
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

  // Atualizar bloco (não permite editar blocos MANUAL)
  const updateBlock = async (id: string, data: BlockFormData) => {
    try {
      // Verificar se é um bloco MANUAL
      const blockToUpdate = blocks.find(b => b.id === id)
      if (blockToUpdate?.type === 'MANUAL') {
        throw new Error('O bloco "Descrições dos Vídeos" não pode ser editado. Ele é gerenciado automaticamente pelo sistema.')
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

  // Função removida - não é mais necessária
  const createManualBlock = async (videoId: string, videoTitle: string) => {
    throw new Error('Esta função foi removida. O bloco Manual é criado automaticamente pelo sistema.')
  }

  // Mover bloco para cima na ordem (trocar posição com o bloco acima)
  const moveBlockUp = async (blockId: string) => {
    try {
      const currentBlockIndex = blocks.findIndex(b => b.id === blockId)
      if (currentBlockIndex === -1 || currentBlockIndex === 0) return // Já está no topo

      const currentBlock = blocks[currentBlockIndex]
      const blockAbove = blocks[currentBlockIndex - 1]

      // Atualizar estado local imediatamente (interface responsiva)
      const updatedBlocks = [...blocks]
      updatedBlocks[currentBlockIndex] = { ...currentBlock, priority: blockAbove.priority }
      updatedBlocks[currentBlockIndex - 1] = { ...blockAbove, priority: currentBlock.priority }
      
      // Reorganizar as prioridades para serem sequenciais
      const reorderedBlocks = reorganizePriorities(updatedBlocks)
      
      // Atualizar estado local primeiro (UX suave)
      setBlocks(reorderedBlocks)

      // Depois atualizar no banco em background
      await updatePrioritiesInDatabase(reorderedBlocks)
      
      toast({
        title: 'Bloco movido',
        description: 'O bloco foi movido para cima.',
      })
    } catch (error) {
      console.error('Erro ao mover bloco:', error)
      // Em caso de erro, recarregar do banco para garantir consistência
      await fetchBlocks()
      toast({
        title: 'Erro',
        description: 'Erro ao mover bloco.',
        variant: 'destructive',
      })
    }
  }

  // Mover bloco para baixo na ordem (trocar posição com o bloco abaixo)
  const moveBlockDown = async (blockId: string) => {
    try {
      const currentBlockIndex = blocks.findIndex(b => b.id === blockId)
      if (currentBlockIndex === -1 || currentBlockIndex === blocks.length - 1) return // Já está no final

      const currentBlock = blocks[currentBlockIndex]
      const blockBelow = blocks[currentBlockIndex + 1]

      // Atualizar estado local imediatamente (interface responsiva)
      const updatedBlocks = [...blocks]
      updatedBlocks[currentBlockIndex] = { ...currentBlock, priority: blockBelow.priority }
      updatedBlocks[currentBlockIndex + 1] = { ...blockBelow, priority: currentBlock.priority }
      
      // Reorganizar as prioridades para serem sequenciais
      const reorderedBlocks = reorganizePriorities(updatedBlocks)
      
      // Atualizar estado local primeiro (UX suave)
      setBlocks(reorderedBlocks)

      // Depois atualizar no banco em background
      await updatePrioritiesInDatabase(reorderedBlocks)
      
      toast({
        title: 'Bloco movido',
        description: 'O bloco foi movido para baixo.',
      })
    } catch (error) {
      console.error('Erro ao mover bloco:', error)
      // Em caso de erro, recarregar do banco para garantir consistência
      await fetchBlocks()
      toast({
        title: 'Erro',
        description: 'Erro ao mover bloco.',
        variant: 'destructive',
      })
    }
  }

  // Ativar/desativar bloco (não permite para blocos MANUAL)
  const toggleBlockActive = async (block: Block) => {
    try {
      if (block.type === 'MANUAL') {
        throw new Error('O bloco "Descrições dos Vídeos" está sempre ativo e não pode ser desativado.')
      }

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
        description: error instanceof Error ? error.message : 'Erro ao alterar status do bloco.',
        variant: 'destructive',
      })
      return { data: null, error }
    }
  }

  // Duplicar bloco (não permite para blocos MANUAL)
  const duplicateBlock = async (block: Block) => {
    try {
      if (block.type === 'MANUAL') {
        throw new Error('O bloco "Descrições dos Vídeos" não pode ser duplicado.')
      }

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
          user_id: user.id,
          video_id: null
        }])
        .select()
        .single()

      if (error) throw error

      // Recarregar lista completa para garantir ordem correta
      await fetchBlocks()
      
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

  // Remover bloco (não permite para blocos MANUAL)
  const deleteBlock = async (block: Block) => {
    try {
      if (block.type === 'MANUAL') {
        throw new Error('O bloco "Descrições dos Vídeos" não pode ser removido. Ele é necessário para o funcionamento do sistema.')
      }

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', block.id)

      if (error) throw error

      // Recarregar lista completa para garantir ordem correta
      await fetchBlocks()
      
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

  useEffect(() => {
    fetchBlocks()
  }, [])

  return {
    blocks,
    loading,
    createBlock,
    createManualBlock,
    updateBlock,
    toggleBlockActive,
    duplicateBlock,
    deleteBlock,
    moveBlockUp,
    moveBlockDown,
    fetchBlocks
  }
}
