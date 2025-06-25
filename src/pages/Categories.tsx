import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search } from "lucide-react"
import { CategoryCard } from "@/components/Categories/CategoryCard"
import { CategoryForm } from "@/components/Categories/CategoryForm"
import { Category } from "@/types/category"
import { useToast } from "@/hooks/use-toast"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function Categories() {
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterParent, setFilterParent] = useState<string>("all")
  const [currentParent, setCurrentParent] = useState<string | null>(null)

  // Mock data with example categories
  const [categories, setCategories] = useState<Category[]>([
    {
      id: "1",
      user_id: "mock-user-id",
      name: "Importação",
      description: "Vídeos sobre importação de produtos",
      parent_id: null,
      color: "#f97316",
      icon: "package",
      is_active: true,
      created_at: "2024-06-15",
      updated_at: "2024-06-15",
      video_count: 12,
      children: [
        {
          id: "1a",
          user_id: "mock-user-id",
          name: "AliExpress",
          description: "Importação via AliExpress",
          parent_id: "1",
          color: "#f97316",
          icon: "package",
          is_active: true,
          created_at: "2024-06-16",
          updated_at: "2024-06-16",
          video_count: 8
        }
      ]
    },
    {
      id: "2",
      user_id: "mock-user-id",
      name: "Internacionalização",
      description: "Expansão internacional de negócios",
      parent_id: null,
      color: "#22c55e",
      icon: "globe",
      is_active: true,
      created_at: "2024-06-10",
      updated_at: "2024-06-10",
      video_count: 8,
      children: []
    },
    {
      id: "3",
      user_id: "mock-user-id",
      name: "Amazon",
      description: "Vendas na plataforma Amazon",
      parent_id: null,
      color: "#3b82f6",
      icon: "shopping-cart",
      is_active: true,
      created_at: "2024-06-05",
      updated_at: "2024-06-05",
      video_count: 15,
      children: [
        {
          id: "3a",
          user_id: "mock-user-id",
          name: "FBA",
          description: "Fulfillment by Amazon",
          parent_id: "3",
          color: "#3b82f6",
          icon: "shopping-cart",
          is_active: true,
          created_at: "2024-06-06",
          updated_at: "2024-06-06",
          video_count: 10
        },
        {
          id: "3b",
          user_id: "mock-user-id",
          name: "PPC",
          description: "Anúncios pagos Amazon",
          parent_id: "3",
          color: "#3b82f6",
          icon: "shopping-cart",
          is_active: true,
          created_at: "2024-06-07",
          updated_at: "2024-06-07",
          video_count: 5
        }
      ]
    },
    {
      id: "4",
      user_id: "mock-user-id",
      name: "Sem Categoria",
      description: "Vídeos não categorizados",
      parent_id: null,
      color: "#6b7280",
      icon: "folder",
      is_active: true,
      created_at: "2024-06-01",
      updated_at: "2024-06-01",
      video_count: 3,
      children: []
    }
  ])

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

  const handleCreateCategory = (data: any) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      user_id: "mock-user-id",
      name: data.name,
      description: data.description,
      parent_id: data.parent_id,
      color: data.color,
      icon: data.icon,
      is_active: data.is_active,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
      video_count: 0,
      children: []
    }

    setCategories([...categories, newCategory])
    toast({
      title: "Categoria criada!",
      description: `A categoria "${data.name}" foi criada com sucesso.`,
    })
  }

  const handleEditCategory = (data: any) => {
    if (!editingCategory) return

    const updatedCategories = categories.map(cat =>
      cat.id === editingCategory.id
        ? {
            ...cat,
            name: data.name,
            description: data.description,
            parent_id: data.parent_id,
            color: data.color,
            icon: data.icon,
            is_active: data.is_active,
            updated_at: new Date().toISOString().split('T')[0],
          }
        : cat
    )

    setCategories(updatedCategories)
    setEditingCategory(null)
    toast({
      title: "Categoria atualizada!",
      description: `As alterações na categoria "${data.name}" foram salvas.`,
    })
  }

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    
    // Check if category has children
    const hasChildren = categories.some(cat => cat.parent_id === categoryId)
    if (hasChildren) {
      toast({
        title: "Não é possível excluir",
        description: "Esta categoria possui subcategorias. Remova-as primeiro.",
        variant: "destructive",
      })
      return
    }

    setCategories(categories.filter(cat => cat.id !== categoryId))
    toast({
      title: "Categoria excluída!",
      description: `A categoria "${category?.name}" foi removida.`,
      variant: "destructive",
    })
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

  const parentCategories = categories.filter(cat => !cat.parent_id)

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
        {getFilteredCategories().map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={handleEdit}
            onDelete={handleDeleteCategory}
          />
        ))}
      </div>

      {getFilteredCategories().length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma categoria encontrada.</p>
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
