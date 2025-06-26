
import { FormItem, FormLabel, FormDescription } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CheckSquare, Square } from "lucide-react"
import { Category } from "@/types/category"
import { OptimizedLoading } from "@/components/ui/optimized-loading"
import { UseFormReturn } from "react-hook-form"

interface CategorySelectorProps {
  form: UseFormReturn<any>
  categories: Category[]
  categoriesLoading: boolean
  selectedCategories: string[]
}

export function CategorySelector({ 
  form, 
  categories, 
  categoriesLoading, 
  selectedCategories 
}: CategorySelectorProps) {
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const currentCategories = form.getValues("categories")
    if (checked) {
      form.setValue("categories", [...currentCategories, categoryId])
    } else {
      form.setValue("categories", currentCategories.filter((id: string) => id !== categoryId))
    }
  }

  const handleSelectAllCategories = () => {
    const allCategoryIds = categories.map(cat => cat.id)
    const allSelected = allCategoryIds.every(id => selectedCategories.includes(id))
    
    if (allSelected) {
      form.setValue("categories", [])
    } else {
      form.setValue("categories", allCategoryIds)
    }
  }

  const allCategoriesSelected = categories.length > 0 && categories.every(cat => selectedCategories.includes(cat.id))
  const someCategoriesSelected = selectedCategories.length > 0 && !allCategoriesSelected

  if (categoriesLoading) {
    return <OptimizedLoading type="categories" message="Carregando categorias..." />
  }

  if (categories.length === 0) {
    return (
      <FormItem>
        <FormLabel>Categorias *</FormLabel>
        <div className="text-center py-4 text-muted-foreground">
          <p>Nenhuma categoria encontrada.</p>
          <p className="text-sm">Crie categorias primeiro para poder selecioná-las.</p>
        </div>
      </FormItem>
    )
  }

  return (
    <FormItem>
      <FormLabel>Categorias *</FormLabel>
      <FormDescription>
        Selecione as categorias onde este bloco será aplicado
      </FormDescription>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAllCategories}
              className="h-auto p-0 flex items-center space-x-2"
            >
              {allCategoriesSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : someCategoriesSelected ? (
                <div className="w-4 h-4 border-2 border-primary bg-primary/20 rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-sm" />
                </div>
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span className="font-medium">
                {allCategoriesSelected ? 'Deselecionar Todas' : 'Selecionar Todas'}
              </span>
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {selectedCategories.length} de {categories.length} selecionadas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={(checked) => 
                  handleCategoryChange(category.id, checked as boolean)
                }
              />
              <Label htmlFor={category.id} className="text-sm flex-1 cursor-pointer">
                {category.name}
                {category.description && (
                  <span className="block text-xs text-muted-foreground">
                    {category.description}
                  </span>
                )}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </FormItem>
  )
}
