
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Package, Globe, ShoppingCart, Folder, FolderTree } from "lucide-react"
import { Category, CategoryFormData } from "@/types/category"

interface CategoryFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: CategoryFormData) => void
  category?: Category | null
  categories: Category[]
}

const iconOptions = [
  { value: "folder", label: "Pasta", icon: Folder },
  { value: "package", label: "Pacote", icon: Package },
  { value: "globe", label: "Globo", icon: Globe },
  { value: "shopping-cart", label: "Carrinho", icon: ShoppingCart },
  { value: "folder-tree", label: "Árvore", icon: FolderTree }
]

const colorOptions = [
  { value: "#f97316", label: "Laranja" },
  { value: "#22c55e", label: "Verde" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#6b7280", label: "Cinza" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#06b6d4", label: "Ciano" }
]

export function CategoryForm({ open, onClose, onSave, category, categories }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    parent_id: "",
    color: "#3b82f6",
    icon: "folder",
    is_active: true
  })

  const [errors, setErrors] = useState<Partial<CategoryFormData>>({})

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        parent_id: category.parent_id || "",
        color: category.color,
        icon: category.icon,
        is_active: category.is_active
      })
    } else {
      setFormData({
        name: "",
        description: "",
        parent_id: "",
        color: "#3b82f6",
        icon: "folder",
        is_active: true
      })
    }
    setErrors({})
  }, [category, open])

  const validateForm = (): boolean => {
    const newErrors: Partial<CategoryFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }

    // Check for duplicate names (excluding current category if editing)
    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === formData.name.toLowerCase() && 
      cat.id !== category?.id
    )
    if (existingCategory) {
      newErrors.name = "Já existe uma categoria com este nome"
    }

    // Check for circular reference
    if (formData.parent_id && category) {
      const wouldCreateCircle = (parentId: string): boolean => {
        if (parentId === category.id) return true
        const parent = categories.find(cat => cat.id === parentId)
        return parent?.parent_id ? wouldCreateCircle(parent.parent_id) : false
      }
      
      if (wouldCreateCircle(formData.parent_id)) {
        newErrors.parent_id = "Não é possível criar referência circular"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave({
        ...formData,
        parent_id: formData.parent_id || undefined
      })
      onClose()
    }
  }

  const availableParentCategories = categories.filter(cat => 
    cat.id !== category?.id && !cat.parent_id
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome da categoria"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição opcional da categoria"
              rows={3}
            />
          </div>

          {/* Categoria Pai */}
          <div className="space-y-2">
            <Label htmlFor="parent">Categoria Pai</Label>
            <Select
              value={formData.parent_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, parent_id: value === "none" ? "" : value }))}
            >
              <SelectTrigger className={errors.parent_id ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecionar categoria pai (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
                {availableParentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.parent_id && (
              <p className="text-sm text-destructive">{errors.parent_id}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Ícone */}
            <div className="space-y-2">
              <Label htmlFor="icon">Ícone</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cor */}
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: option.value }}
                        />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Categoria ativa</Label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {category ? "Atualizar" : "Criar"} Categoria
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
