
import { Button } from "@/components/ui/button"

interface CategoryFormActionsProps {
  isEditing: boolean
  onCancel: () => void
  onSubmit: () => void
  isLoading?: boolean
}

export function CategoryFormActions({ 
  isEditing, 
  onCancel, 
  onSubmit,
  isLoading = false
}: CategoryFormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancelar
      </Button>
      <Button 
        type="submit" 
        onClick={onSubmit}
        disabled={isLoading}
      >
        {isEditing ? "Atualizar" : "Criar"} Categoria
      </Button>
    </div>
  )
}
