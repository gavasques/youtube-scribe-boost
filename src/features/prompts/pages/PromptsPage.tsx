
// Move Prompts page to feature folder
import { useState } from "react"
import { Prompt, PromptFormData } from "../types"
import { PromptHeader } from "@/components/Prompts/PromptHeader"
import { PromptFilters } from "@/components/Prompts/PromptFilters"
import { PromptStats } from "@/components/Prompts/PromptStats"
import { PromptList } from "@/components/Prompts/PromptList"
import { PromptEditor } from "@/components/Prompts/PromptEditor"
import { useOptimizedPrompts } from "../hooks/useOptimizedPrompts"
import { usePromptActions } from "../hooks/usePromptActions"
import { usePromptFilters } from "@/hooks/usePromptFilters"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function PromptsPage() {
  const { prompts, loading, setPrompts } = useOptimizedPrompts()
  const { createPrompt, updatePrompt, togglePromptActive, duplicatePrompt, deletePrompt } = usePromptActions()
  const { filters, filteredPrompts, updateSearchTerm, updateStatusFilter, hasFilters } = usePromptFilters(prompts)
  
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const handleNewPrompt = () => {
    setSelectedPrompt(null)
    setIsEditorOpen(true)
  }

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setIsEditorOpen(true)
  }

  const handleSavePrompt = async (data: PromptFormData) => {
    let result
    if (selectedPrompt) {
      result = await updatePrompt(selectedPrompt.id, data)
      if (result.data) {
        setPrompts(prev => prev.map(p => p.id === selectedPrompt.id ? result.data as Prompt : p))
      }
    } else {
      result = await createPrompt(data)
      if (result.data) {
        setPrompts(prev => [result.data as Prompt, ...prev])
      }
    }
    
    if (result.data) {
      setIsEditorOpen(false)
    }
  }

  const handleToggleActive = async (prompt: Prompt) => {
    const result = await togglePromptActive(prompt)
    if (result.data) {
      setPrompts(prev => prev.map(p => p.id === prompt.id ? result.data as Prompt : p))
    }
  }

  const handleDuplicate = async (prompt: Prompt) => {
    const result = await duplicatePrompt(prompt)
    if (result.data) {
      setPrompts(prev => [result.data as Prompt, ...prev])
    }
  }

  const handleDelete = async (prompt: Prompt) => {
    const result = await deletePrompt(prompt)
    if (!result.error) {
      setPrompts(prev => prev.filter(p => p.id !== prompt.id))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PromptHeader onNewPrompt={handleNewPrompt} />

      <PromptFilters
        searchTerm={filters.searchTerm}
        statusFilter={filters.statusFilter}
        onSearchChange={updateSearchTerm}
        onStatusChange={updateStatusFilter}
      />

      <PromptStats prompts={prompts} />

      <PromptList
        prompts={filteredPrompts}
        onEdit={handleEditPrompt}
        onToggleActive={handleToggleActive}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onNewPrompt={handleNewPrompt}
      />

      <PromptEditor
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        prompt={selectedPrompt}
        onSave={handleSavePrompt}
      />
    </div>
  )
}
