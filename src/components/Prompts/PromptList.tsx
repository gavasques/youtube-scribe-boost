
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Plus } from "lucide-react"
import { Prompt } from "@/types/prompt"
import { PromptCard } from "./PromptCard"

interface PromptListProps {
  prompts: Prompt[]
  onEdit: (prompt: Prompt) => void
  onToggleActive: (prompt: Prompt) => void
  onDuplicate: (prompt: Prompt) => void
  onDelete: (prompt: Prompt) => void
  onNewPrompt: () => void
}

export function PromptList({ 
  prompts, 
  onEdit, 
  onToggleActive, 
  onDuplicate, 
  onDelete,
  onNewPrompt 
}: PromptListProps) {
  if (prompts.length === 0) {
    return (
      <Card className="border-amber-200">
        <CardContent className="p-8 text-center">
          <Brain className="w-12 h-12 mx-auto text-amber-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum prompt encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Não há prompts que correspondam aos filtros aplicados.
          </p>
          <Button onClick={onNewPrompt} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-0">
            <Plus className="w-4 h-4" />
            Criar Novo Prompt
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {prompts.map(prompt => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
