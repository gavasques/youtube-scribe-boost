
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Power } from "lucide-react"
import { Category } from "@/types/category"

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (categoryId: string) => void
  onToggleActive?: (category: Category) => void
}

export function CategoryCard({ category, onEdit, onDelete, onToggleActive }: CategoryCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{category.name}</CardTitle>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {category.description}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            {onToggleActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleActive(category)}
                className="h-8 w-8 p-0"
                title={category.is_active ? "Desativar categoria" : "Ativar categoria"}
              >
                <Power className={`w-4 h-4 ${category.is_active ? 'text-green-600' : 'text-gray-400'}`} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant={category.is_active ? "default" : "secondary"}>
            {category.is_active ? "Ativa" : "Inativa"}
          </Badge>
          <div className="text-right">
            <p className="text-sm font-medium">{category.video_count || 0}</p>
            <p className="text-xs text-muted-foreground">vídeos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
