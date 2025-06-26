
// Unit tests for useOptimizedBlocks hook
import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useOptimizedBlocks } from '@/features/blocks/hooks/useOptimizedBlocks'

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            count: 0,
            error: null
          }))
        }))
      }))
    }))
  }
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}))

vi.mock('@/features/blocks/hooks/useBlockActions', () => ({
  useBlockActions: () => ({
    createBlock: vi.fn(),
    updateBlock: vi.fn(),
    toggleBlockActive: vi.fn(),
    deleteBlock: vi.fn()
  })
}))

describe('useOptimizedBlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch blocks on mount', async () => {
    const { result } = renderHook(() => useOptimizedBlocks())
    
    expect(result.current.loading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.blocks).toEqual([])
    expect(result.current.totalCount).toBe(0)
  })

  it('should handle create block action', async () => {
    const { result } = renderHook(() => useOptimizedBlocks())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    const mockData = {
      title: 'Test Block',
      content: 'Test content',
      type: 'GLOBAL' as const,
      scope: 'PERMANENT' as const
    }
    
    const createResult = await result.current.createBlock(mockData)
    expect(createResult).toBeDefined()
  })
})
