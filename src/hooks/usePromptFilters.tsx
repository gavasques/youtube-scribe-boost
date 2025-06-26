
import { useMemo, useState } from 'react'
import { Prompt } from '@/types/prompt'

interface PromptFilters {
  searchTerm: string
  statusFilter: string
}

export function usePromptFilters(prompts: Prompt[]) {
  const [filters, setFilters] = useState<PromptFilters>({
    searchTerm: '',
    statusFilter: 'all'
  })

  const filteredPrompts = useMemo(() => {
    let filtered = prompts

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(prompt => 
        prompt.name.toLowerCase().includes(searchLower) ||
        prompt.description?.toLowerCase().includes(searchLower) ||
        prompt.prompt.toLowerCase().includes(searchLower)
      )
    }

    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(prompt => 
        filters.statusFilter === 'active' ? prompt.is_active : !prompt.is_active
      )
    }

    return filtered
  }, [prompts, filters])

  const updateSearchTerm = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }))
  }

  const updateStatusFilter = (statusFilter: string) => {
    setFilters(prev => ({ ...prev, statusFilter }))
  }

  const hasFilters = filters.searchTerm || filters.statusFilter !== 'all'

  return {
    filters,
    filteredPrompts,
    updateSearchTerm,
    updateStatusFilter,
    hasFilters
  }
}
