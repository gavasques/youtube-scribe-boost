
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Brain, Edit, Copy, Power, PowerOff, Trash2 } from "lucide-react"
import { Prompt } from "@/types/prompt"

interface PromptCardProps {
  prompt: Prompt
  onEdit: (prompt: Prompt) => void
  onToggleActive: (prompt: Prompt) => void
  onDuplicate: (prompt: Prompt) => void
  onDelete: (prompt: Prompt) => void
}

export function PromptCard({ prompt, onEdit, onToggleActive, onDuplicate, onDelete }: PromptCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-500" />
              {prompt.name}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant={prompt.is_active ? "default" : "secondary"}>
                {prompt.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleActive(prompt)}
              title={prompt.is_active ? "Desativar" : "Ativar"}
            >
              {prompt.is_active ? (
                <PowerOff className="w-4 h-4" />
              ) : (
                <Power className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(prompt)}
              title="Duplicar"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(prompt)}
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  title="Remover"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover Prompt</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover o prompt "{prompt.name}"? 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(prompt)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {prompt.description}
        </p>
        <div className="bg-muted/50 p-3 rounded-md mb-4">
          <p className="text-xs text-muted-foreground mb-1">Preview do Prompt:</p>
          <p className="text-sm font-mono line-clamp-3">
            {prompt.prompt}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          <div>Atualizado em: {new Date(prompt.updated_at).toLocaleDateString('pt-BR')}</div>
          <div className="mt-1">
            Parâmetros: Temp {prompt.temperature} • Tokens {prompt.max_tokens} • Top-P {prompt.top_p}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
