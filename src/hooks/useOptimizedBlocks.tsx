
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/core/Logger'
import { errorHandler } from '@/core/ErrorHandler'
import { BlockUI, BlockFormData } from '@/types/block'
import { useBlockActions } from '@/hooks/useBlockActions'

interface UseOptimizedBlocksResult {
  blocks: BlockUI[]
  loading: boolean
  error: string | null
  refreshBlocks: () => Promise<void>
  totalCount: number
  createBlock: (data: BlockFormData) => Promise<{ data?: BlockUI; error?: string }>
  updateBlock: (id: string, data: BlockFormData) => Promise<{ data?: BlockUI; error?: string }>
  toggleBlockActive: (block: BlockUI) => Promise<{ data?: BlockUI; error?: string }>
  deleteBlock: (block: BlockUI) => Promise<{ error?: string }>
  moveBlockUp: (blockId: string) => Promise<void>
  moveBlockDown: (blockId: string) => Promise<void>
}

export function useOptimizedBlocks(): UseOptimizedBlocksResult {
  const { user } = useAuth()
  const [blocks, setBlocks] = useState<BlockUI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const { 
    createBlock: createBlockAction,
    updateBlock: updateBlockAction,
    toggleBlockActive: toggleBlockActiveAction,
    deleteBlock: deleteBlockAction
  } = useBlockActions()

  const convertToBlockUI = (block: any): BlockUI => {
    return {
      id: block.id,
      title: block.title,
      content: block.content,
      type: block.type,
      scope: block.scope || 'PERMANENT',
      priority: block.priority || 0,
      isActive: block.is_active,
      scheduledStart: block.scheduled_start,
      scheduledEnd: block.scheduled_end,
      categories: [], // Will be populated if needed
      createdAt: block.created_at,
      videoId: block.video_id,
      videoTitle: undefined,
      videoDescription: undefined
    }
  }

  const fetchBlocks = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      logger.debug('Fetching optimized blocks', { userId: user.id })

      const { data, count, error: fetchError } = await supabase
        .from('blocks')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('priority', { ascending: true })

      if (fetchError) throw fetchError

      const convertedBlocks = (data || []).map(convertToBlockUI)
      setBlocks(convertedBlocks)
      setTotalCount(count || 0)
      
      logger.debug('Blocks fetched successfully', { count: data?.length })
    } catch (err) {
      const appError = errorHandler.handle(err, {
        context: 'useOptimizedBlocks.fetchBlocks',
        showToast: true
      })
      setError(appError.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchBlocks()
  }, [fetchBlocks])

  const createBlock = async (data: BlockFormData) => {
    const result = await createBlockAction(data)
    if (result.data) {
      await fetchBlocks()
    }
    return result
  }

  const updateBlock = async (id: string, data: BlockFormData) => {
    const result = await updateBlockAction(id, data)
    if (result.data) {
      await fetchBlocks()
    }
    return result
  }

  const toggleBlockActive = async (block: BlockUI) => {
    const result = await toggleBlockActiveAction(block)
    if (result.data) {
      await fetchBlocks()
    }
    return result
  }

  const deleteBlock = async (block: BlockUI) => {
    const result = await deleteBlockAction(block)
    if (!result.error) {
      await fetchBlocks()
    }
    return result
  }

  const moveBlockUp = async (blockId: string) => {
    // Implementation for moving blocks up in priority
    await fetchBlocks()
  }

  const moveBlockDown = async (blockId: string) => {
    // Implementation for moving blocks down in priority
    await fetchBlocks()
  }

  // Memoize expensive computations
  const activeBlocks = useMemo(() => 
    blocks.filter(block => block.isActive), 
    [blocks]
  )

  return {
    blocks: activeBlocks,
    loading,
    error,
    refreshBlocks: fetchBlocks,
    totalCount,
    createBlock,
    updateBlock,
    toggleBlockActive,
    deleteBlock,
    moveBlockUp,
    moveBlockDown
  }
}
