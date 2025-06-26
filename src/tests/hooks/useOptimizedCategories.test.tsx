
// Unit tests for useOptimizedCategories hook
import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useOptimizedCategories } from '@/features/categories/hooks/useOptimizedCategories'

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

vi.mock('@/features/categories/hooks/useCategoryActions', () => ({
  useCategoryActions: () => ({
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    toggleCategoryActive: vi.fn(),
    isLoading: false
  })
}))

describe('useOptimizedCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch categories on mount', async () => {
    const { result } = renderHook(() => useOptimizedCategories())
    
    expect(result.current.loading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.categories).toEqual([])
    expect(result.current.totalCount).toBe(0)
  })

  it('should filter active categories', async () => {
    const { result } = renderHook(() => useOptimizedCategories())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.activeCategories).toEqual([])
  })
})
