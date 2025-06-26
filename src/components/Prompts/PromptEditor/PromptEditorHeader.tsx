
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Brain } from "lucide-react"

interface PromptEditorHeaderProps {
  isEditing: boolean
}

export function PromptEditorHeader({ isEditing }: PromptEditorHeaderProps) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Brain className="w-5 h-5" />
        {isEditing ? "Editar Prompt" : "Novo Prompt"}
      </DialogTitle>
    </DialogHeader>
  )
}
