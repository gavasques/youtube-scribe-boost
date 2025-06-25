
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Edit, Brain, MessageSquare } from "lucide-react"

export default function Prompts() {
  const prompts = [
    {
      id: "1",
      name: "Gerador de Resumos",
      type: "summary_generator",
      model: "gpt-4o",
      content: "Crie um resumo conciso e envolvente do vídeo baseado na transcrição...",
      isActive: true
    },
    {
      id: "2", 
      name: "Gerador de Capítulos",
      type: "chapter_generator", 
      model: "gpt-4.1",
      content: "Analise a transcrição e crie capítulos com timestamps...",
      isActive: true
    },
    {
      id: "3",
      name: "Gerador de Tags",
      type: "tag_generator",
      model: "gpt-4o-mini", 
      content: "Gere tags relevantes e otimizadas para SEO...",
      isActive: true
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompts IA</h1>
          <p className="text-muted-foreground">
            Configure os prompts para processamento inteligente de conteúdo
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Prompt
        </Button>
      </div>

      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    {prompt.name}
                  </CardTitle>
                  <CardDescription>
                    Modelo: {prompt.model}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={prompt.isActive ? "default" : "secondary"}>
                    {prompt.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">{prompt.content}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
