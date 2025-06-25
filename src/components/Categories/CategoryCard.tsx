
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, FolderTree, Package, Globe, ShoppingCart, Folder } from "lucide-react"
import { Category } from "@/types/category"

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (categoryId: string) => void
}

const iconMap = {
  package: Package,
  globe: Globe,
  'shopping-cart': ShoppingCart,
  folder: Folder,
  'folder-tree': FolderTree
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Folder

  return (
    <Card 
      className="hover:shadow-lg transition-shadow relative overflow-hidden"
      style={{ backgroundColor: `${category.color}20`, borderColor: category.color }}
    >
      {/* Color accent bar */}
      <div 
        className="absolute top-0 left-0 w-full h-1"
        style={{ backgroundColor: category.color }}
      />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${category.color}30` }}
            >
              <IconComponent 
                className="w-5 h-5" 
                style={{ color: category.color }}
              />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{category.name}</CardTitle>
              {category.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
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
          <div className="flex items-center gap-2">
            <Badge variant={category.is_active ? "default" : "secondary"}>
              {category.is_active ? "Ativa" : "Inativa"}
            </Badge>
            {category.parent_id && (
              <Badge variant="outline" className="gap-1">
                <FolderTree className="w-3 h-3" />
                Subcategoria
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{category.video_count || 0}</p>
            <p className="text-xs text-muted-foreground">vídeos</p>
          </div>
        </div>

        {/* Children categories */}
        {category.children && category.children.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Subcategorias:</p>
            <div className="flex flex-wrap gap-1">
              {category.children.map((child) => (
                <Badge key={child.id} variant="outline" className="text-xs">
                  {child.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
