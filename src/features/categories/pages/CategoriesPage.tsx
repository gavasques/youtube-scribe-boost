
// Move Categories page to feature folder
import { useState } from "react"
import { Category } from "../types"
import { CategoryHeader } from "@/components/Categories/CategoryHeader"
import { CategorySearch } from "@/components/Categories/CategorySearch"
import { CategoryGrid } from "@/components/Categories/CategoryGrid"
import { CategoryEmptyState } from "@/components/Categories/CategoryEmptyState"
import { CategoryForm } from "@/components/Categories/CategoryForm"
import { useOptimizedCategories } from "../hooks/useOptimizedCategories"
import { useCategoryFilters } from "@/hooks/useCategoryFilters"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function CategoriesPage() {
  const {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
    isActionLoading
  } = useOptimizedCategories()

  const {
    filters,
    filteredCategories,
    updateSearchTerm,
    hasFilters
  } = useCategoryFilters(categories)

  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const handleCreateCategory = async (data: any) => {
    await createCategory(data)
    setShowForm(false)
  }

  const handleEditCategory = async (data: any) => {
    if (!editingCategory) return
    await updateCategory(editingCategory.id, data)
    setEditingCategory(null)
    setShowForm(false)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    if (!category) return
    await deleteCategory(category)
  }

  const handleToggleActive = async (category: Category) => {
    await toggleCategoryActive(category)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCategory(null)
  }

  const handleCreateNew = () => {
    setEditingCategory(null)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CategoryHeader onCreateCategory={handleCreateNew} />

      <CategorySearch
        value={filters.searchTerm}
        onChange={updateSearchTerm}
      />

      {filteredCategories.length > 0 ? (
        <CategoryGrid
          categories={filteredCategories}
          onEdit={handleEdit}
          onDelete={handleDeleteCategory}
          onToggleActive={handleToggleActive}
        />
      ) : (
        <CategoryEmptyState
          hasCategories={categories.length > 0}
          hasFilters={Boolean(hasFilters)}
        />
      )}

      <CategoryForm
        open={showForm}
        onClose={handleCloseForm}
        onSave={editingCategory ? handleEditCategory : handleCreateCategory}
        category={editingCategory}
        isLoading={isActionLoading}
      />
    </div>
  )
}
