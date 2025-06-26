
import { useOptimizedPrompts } from './useOptimizedPrompts'
import { usePromptActions } from './usePromptActions'

export function usePrompts() {
  const { prompts, loading, fetchPrompts, setPrompts } = useOptimizedPrompts()
  const { createPrompt, updatePrompt, togglePromptActive, duplicatePrompt, deletePrompt } = usePromptActions()

  const handleCreatePrompt = async (data: any) => {
    const result = await createPrompt(data)
    if (result.data) {
      setPrompts(prev => [result.data, ...prev])
    }
    return result
  }

  const handleUpdatePrompt = async (id: string, data: any) => {
    const result = await updatePrompt(id, data)
    if (result.data) {
      setPrompts(prev => prev.map(p => p.id === id ? result.data : p))
    }
    return result
  }

  const handleTogglePromptActive = async (prompt: any) => {
    const result = await togglePromptActive(prompt)
    if (result.data) {
      setPrompts(prev => prev.map(p => p.id === prompt.id ? result.data : p))
    }
    return result
  }

  const handleDuplicatePrompt = async (prompt: any) => {
    const result = await duplicatePrompt(prompt)
    if (result.data) {
      setPrompts(prev => [result.data, ...prev])
    }
    return result
  }

  const handleDeletePrompt = async (prompt: any) => {
    const result = await deletePrompt(prompt)
    if (!result.error) {
      setPrompts(prev => prev.filter(p => p.id !== prompt.id))
    }
    return result
  }

  return {
    prompts,
    loading,
    createPrompt: handleCreatePrompt,
    updatePrompt: handleUpdatePrompt,
    togglePromptActive: handleTogglePromptActive,
    duplicatePrompt: handleDuplicatePrompt,
    deletePrompt: handleDeletePrompt,
    fetchPrompts
  }
}
