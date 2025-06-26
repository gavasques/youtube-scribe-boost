
import { useState, useMemo } from 'react'
import { Category } from '@/types/category'
import { useDebounce } from '@/hooks/useDebounce'
import { CATEGORY_DEFAULTS } from '@/utils/categoryConstants'

interface CategoryFilters {
  searchTerm: string
  showInactive: boolean
}

export function useCategoryFilters(categories: Category[]) {
  const [filters, setFilters] = useState<CategoryFilters>({
    searchTerm: '',
    showInactive: true
  })

  const debouncedSearchTerm = useDebounce(filters.searchTerm, CATEGORY_DEFAULTS.SEARCH_DEBOUNCE_MS)

  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      // Filter by search term
      const matchesSearch = !debouncedSearchTerm || 
        category.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

      // Filter by active status
      const matchesStatus = filters.showInactive || category.is_active

      return matchesSearch && matchesStatus
    })
  }, [categories, debouncedSearchTerm, filters.showInactive])

  const updateSearchTerm = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }))
  }

  const toggleShowInactive = () => {
    setFilters(prev => ({ ...prev, showInactive: !prev.showInactive }))
  }

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      showInactive: true
    })
  }

  return {
    filters,
    filteredCategories,
    updateSearchTerm,
    toggleShowInactive,
    clearFilters,
    hasFilters: filters.searchTerm || !filters.showInactive
  }
}
