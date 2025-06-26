
import { useState, useMemo } from 'react'
import { BlockUI } from '@/types/block'

interface FilterState {
  searchTerm: string
  typeFilter: string
  statusFilter: string
  sortBy: 'priority' | 'name'
  sortOrder: 'asc' | 'desc'
}

export function useBlockFilters(blocks: BlockUI[]) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    typeFilter: 'all',
    statusFilter: 'all',
    sortBy: 'priority',
    sortOrder: 'asc'
  })

  const filteredAndSortedBlocks = useMemo(() => {
    let filtered = blocks.filter(block => {
      const matchesSearch = block.title.toLowerCase().includes(filters.searchTerm.toLowerCase())
      const matchesType = filters.typeFilter === 'all' || block.type === filters.typeFilter
      const matchesStatus = filters.statusFilter === 'all' || 
        (filters.statusFilter === 'active' && block.isActive) ||
        (filters.statusFilter === 'inactive' && !block.isActive)
      
      return matchesSearch && matchesType && matchesStatus
    })

    filtered.sort((a, b) => {
      let comparison = 0
      
      if (filters.sortBy === 'priority') {
        comparison = a.priority - b.priority
      } else if (filters.sortBy === 'name') {
        comparison = a.title.localeCompare(b.title)
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [blocks, filters])

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleSort = (field: 'priority' | 'name') => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }))
  }

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      typeFilter: 'all',
      statusFilter: 'all',
      sortBy: 'priority',
      sortOrder: 'asc'
    })
  }

  return {
    filters,
    filteredAndSortedBlocks,
    updateFilter,
    toggleSort,
    resetFilters
  }
}
