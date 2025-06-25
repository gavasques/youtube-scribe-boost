
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Globe, FolderTree } from "lucide-react"
import { Block } from "./BlocksTable"

interface BlockPreviewProps {
  block: Block
}

export function BlockPreview({ block }: BlockPreviewProps) {
  const getTypeBadge = (type: string) => {
    return type === "GLOBAL" ? (
      <Badge variant="default" className="gap-1">
        <Globe className="w-3 h-3" />
        Global
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <FolderTree className="w-3 h-3" />
        Categoria
      </Badge>
    )
  }

  const getScopeBadge = (scope: string) => {
    return scope === "PERMANENT" ? (
      <Badge variant="secondary">Permanente</Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <Calendar className="w-3 h-3" />
        Agendado
      </Badge>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{block.title}</CardTitle>
            {block.description && (
              <CardDescription>{block.description}</CardDescription>
            )}
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
            <p className="text-sm whitespace-pre-wrap font-mono">{block.content}</p>
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
          {block.scope === "SCHEDULED" && (
            <div className="text-sm text-muted-foreground">
              <p>Período: {block.scheduledStart} até {block.scheduledEnd}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Prioridade: {block.priority}</span>
            <span>{block.videosAffected} vídeos afetados</span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge variant={block.isActive ? "default" : "secondary"}>
              {block.isActive ? "Ativo" : "Inativo"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Criado em {block.createdAt}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
