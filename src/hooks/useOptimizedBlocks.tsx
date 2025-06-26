
import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/core/Logger'
import { errorHandler } from '@/core/ErrorHandler'

interface Block {
  id: string
  title: string
  content: string
  type: 'UNIVERSAL' | 'CATEGORY_SPECIFIC'
  category_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UseOptimizedBlocksResult {
  blocks: Block[]
  loading: boolean
  error: string | null
  refreshBlocks: () => Promise<void>
  totalCount: number
}

export function useOptimizedBlocks(): UseOptimizedBlocksResult {
  const { user } = useAuth()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

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
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      setBlocks(data || [])
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

  // Memoize expensive computations
  const activeBlocks = useMemo(() => 
    blocks.filter(block => block.is_active), 
    [blocks]
  )

  const universalBlocks = useMemo(() => 
    blocks.filter(block => block.type === 'UNIVERSAL'), 
    [blocks]
  )

  const categoryBlocks = useMemo(() => 
    blocks.filter(block => block.type === 'CATEGORY_SPECIFIC'), 
    [blocks]
  )

  return {
    blocks: activeBlocks,
    loading,
    error,
    refreshBlocks: fetchBlocks,
    totalCount
  }
}
