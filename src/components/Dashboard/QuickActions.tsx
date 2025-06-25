
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Youtube, Plus, Folder, Settings } from "lucide-react"

export function QuickActions() {
  const actions = [
    {
      title: "Conectar YouTube",
      description: "Conecte sua conta do YouTube para começar",
      icon: Youtube,
      variant: "default" as const,
      action: () => console.log("Conectar YouTube")
    },
    {
      title: "Criar Primeiro Bloco",
      description: "Crie seu primeiro bloco de conteúdo",
      icon: Plus,
      variant: "outline" as const,
      action: () => console.log("Criar bloco")
    },
    {
      title: "Adicionar Categoria",
      description: "Organize seus vídeos por categorias",
      icon: Folder,
      variant: "outline" as const,
      action: () => console.log("Adicionar categoria")
    },
    {
      title: "Configurar IA",
      description: "Configure os prompts de IA",
      icon: Settings,
      variant: "outline" as const,
      action: () => console.log("Configurar IA")
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>
          Comece configurando seu sistema para automatizar as descrições
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto flex-col gap-2 p-4"
              onClick={action.action}
            >
              <action.icon className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
