
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search } from "lucide-react"
import { CategoryCard } from "@/components/Categories/CategoryCard"
import { CategoryForm } from "@/components/Categories/CategoryForm"
import { Category } from "@/types/category"
import { useCategories } from "@/hooks/useCategories"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

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
  const [filterParent, setFilterParent] = useState<string>("all")
  const [currentParent, setCurrentParent] = useState<string | null>(null)

  // Build hierarchy helper
  const buildHierarchy = (cats: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>()
    const rootCategories: Category[] = []

    // Create map and initialize children arrays
    cats.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Build hierarchy
    cats.forEach(cat => {
      const category = categoryMap.get(cat.id)!
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id)
        if (parent) {
          parent.children!.push(category)
        }
      } else {
        rootCategories.push(category)
      }
    })

    return rootCategories
  }

  const hierarchicalCategories = buildHierarchy(categories)

  // Filter categories
  const getFilteredCategories = () => {
    let filtered = hierarchicalCategories

    if (currentParent) {
      const parent = categories.find(cat => cat.id === currentParent)
      filtered = parent?.children || []
    }

    if (searchTerm) {
      filtered = filtered.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterParent !== "all") {
      if (filterParent === "root") {
        filtered = filtered.filter(cat => !cat.parent_id)
      } else if (filterParent === "child") {
        filtered = filtered.filter(cat => cat.parent_id)
      }
    }

    return filtered
  }

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
    
    // Check if category has children
    const hasChildren = categories.some(cat => cat.parent_id === categoryId)
    if (hasChildren) {
      // This will be handled by the hook's error handling
      return
    }

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

  const getCurrentParentName = () => {
    if (!currentParent) return null
    return categories.find(cat => cat.id === currentParent)?.name
  }

  const filteredCategories = getFilteredCategories()

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
            Organize seus vídeos em categorias hierárquicas
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Breadcrumb */}
      {currentParent && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                className="cursor-pointer"
                onClick={() => setCurrentParent(null)}
              >
                Categorias
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{getCurrentParentName()}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterParent} onValueChange={setFilterParent}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="root">Apenas principais</SelectItem>
            <SelectItem value="child">Apenas subcategorias</SelectItem>
          </SelectContent>
        </Select>
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
              : "Nenhuma categoria corresponde aos filtros aplicados."
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
