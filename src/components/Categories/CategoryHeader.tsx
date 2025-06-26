
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface CategoryHeaderProps {
  onCreateCategory: () => void
}

export function CategoryHeader({ onCreateCategory }: CategoryHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
        <p className="text-muted-foreground">
          Organize seus vídeos em categorias
        </p>
      </div>
      <Button className="gap-2" onClick={onCreateCategory}>
        <Plus className="w-4 h-4" />
        Nova Categoria
      </Button>
    </div>
  )
}
