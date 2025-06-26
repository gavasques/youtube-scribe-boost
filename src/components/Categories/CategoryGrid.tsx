
import { Category } from "@/types/category"
import { CategoryCard } from "./CategoryCard"

interface CategoryGridProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (categoryId: string) => void
  onToggleActive: (category: Category) => void
}

export function CategoryGrid({ 
  categories, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: CategoryGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
        />
      ))}
    </div>
  )
}
