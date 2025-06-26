
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Power } from "lucide-react"
import { Category } from "@/types/category"
import { formatCategoryStatus, formatVideoCount } from "@/utils/categoryFormatters"

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (categoryId: string) => void
  onToggleActive: (category: Category) => void
}

export function CategoryCard({ category, onEdit, onDelete, onToggleActive }: CategoryCardProps) {
  const videoCount = formatVideoCount(category.video_count || 0)
  const statusText = formatCategoryStatus(category.is_active)
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {category.name}
            </CardTitle>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 ml-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleActive(category)}
              className="h-8 w-8 p-0"
              title={category.is_active ? "Desativar categoria" : "Ativar categoria"}
            >
              <Power className={`w-4 h-4 ${category.is_active ? 'text-green-600' : 'text-gray-400'}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
              className="h-8 w-8 p-0"
              title="Editar categoria"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Excluir categoria"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant={category.is_active ? "default" : "secondary"}>
            {statusText}
          </Badge>
          <div className="text-right">
            <p className="text-sm font-medium">{videoCount.text}</p>
            <p className="text-xs text-muted-foreground">{videoCount.label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
