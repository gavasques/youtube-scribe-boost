
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface PromptHeaderProps {
  onNewPrompt: () => void
}

export function PromptHeader({ onNewPrompt }: PromptHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Prompts IA
        </h1>
        <p className="text-muted-foreground">
          Configure os prompts para processamento inteligente de conteúdo
        </p>
      </div>
      <Button onClick={onNewPrompt} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-0">
        <Plus className="w-4 h-4" />
        Novo Prompt
      </Button>
    </div>
  )
}
