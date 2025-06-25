
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit, Calendar, Globe, FolderTree } from "lucide-react"

export default function Blocks() {
  const blocks = [
    {
      id: "1",
      name: "CTA Principal",
      type: "global",
      scope: "permanent",
      content: "🔔 Inscreva-se no canal e ative o sininho!",
      categories: [],
      isActive: true,
      createdAt: "2024-06-15"
    },
    {
      id: "2",
      name: "Links Redes Sociais", 
      type: "global",
      scope: "permanent",
      content: "📱 Me siga nas redes:\n- Instagram: @meucanal\n- Twitter: @meucanal",
      categories: [],
      isActive: true,
      createdAt: "2024-06-10"
    },
    {
      id: "3",
      name: "Promoção Black Friday",
      type: "global", 
      scope: "scheduled",
      content: "🔥 BLACK FRIDAY: 50% OFF em todos os cursos até 30/11!",
      categories: [],
      isActive: false,
      scheduleStart: "2024-11-20",
      scheduleEnd: "2024-11-30",
      createdAt: "2024-06-01"
    },
    {
      id: "4",
      name: "Tutorial Específico",
      type: "category",
      scope: "permanent", 
      content: "📚 Mais tutoriais na playlist: [LINK]",
      categories: ["Tutoriais", "Programação"],
      isActive: true,
      createdAt: "2024-05-28"
    }
  ]

  const getTypeBadge = (type: string) => {
    return type === "global" ? (
      <Badge variant="default" className="gap-1">
        <Globe className="w-3 h-3" />
        Universal
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <FolderTree className="w-3 h-3" />
        Categoria
      </Badge>
    )
  }

  const getScopeBadge = (scope: string) => {
    return scope === "permanent" ? (
      <Badge variant="secondary">Permanente</Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <Calendar className="w-3 h-3" />
        Agendado
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blocos</h1>
          <p className="text-muted-foreground">
            Gerencie os blocos de conteúdo para suas descrições
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Bloco
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Blocos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar blocos..." className="pl-8" />
          </div>
        </CardContent>
      </Card>

      {/* Blocks Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {blocks.map((block) => (
          <Card key={block.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{block.name}</CardTitle>
                  <CardDescription>
                    Criado em {block.createdAt}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {getTypeBadge(block.type)}
                  {getScopeBadge(block.scope)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Content Preview */}
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{block.content}</p>
                </div>

                {/* Categories */}
                {block.categories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Categorias:</p>
                    <div className="flex gap-1 flex-wrap">
                      {block.categories.map((category) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schedule Info */}
                {block.scope === "scheduled" && (
                  <div className="text-sm text-muted-foreground">
                    <p>Início: {block.scheduleStart}</p>
                    <p>Fim: {block.scheduleEnd}</p>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge variant={block.isActive ? "default" : "secondary"}>
                    {block.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
