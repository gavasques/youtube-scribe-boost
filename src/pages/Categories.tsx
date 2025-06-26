
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { CategoryCard } from "@/components/Categories/CategoryCard"
import { CategoryForm } from "@/components/Categories/CategoryForm"
import { Category } from "@/types/category"
import { useCategories } from "@/hooks/useCategories"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Categories() {
  const {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive
  } = useCategories()

  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter categories
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateCategory = async (data: any) => {
    await createCategory(data)
  }

  const handleEditCategory = async (data: any) => {
    if (!editingCategory) return
    await updateCategory(editingCategory.id, data)
    setEditingCategory(null)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Organize seus vídeos em categorias
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar categorias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={handleEdit}
            onDelete={handleDeleteCategory}
            onToggleActive={handleToggleActive}
          />
        ))}
      </div>

      {filteredCategories.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {categories.length === 0 
              ? "Nenhuma categoria encontrada. Crie sua primeira categoria!"
              : "Nenhuma categoria corresponde ao termo de busca."
            }
          </p>
        </div>
      )}

      {/* Form Modal */}
      <CategoryForm
        open={showForm}
        onClose={handleCloseForm}
        onSave={editingCategory ? handleEditCategory : handleCreateCategory}
        category={editingCategory}
        categories={categories}
      />
    </div>
  )
}
