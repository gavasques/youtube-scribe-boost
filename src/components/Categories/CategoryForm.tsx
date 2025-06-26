
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Category, CategoryFormData } from "@/types/category"
import { CategoryFormFields } from "./CategoryForm/CategoryFormFields"
import { CategoryFormActions } from "./CategoryForm/CategoryFormActions"
import { validateCategoryForm } from "@/utils/categoryValidation"
import { CATEGORY_DEFAULTS } from "@/utils/categoryConstants"

interface CategoryFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: CategoryFormData) => void
  category?: Category | null
  isLoading?: boolean
}

export function CategoryForm({ 
  open, 
  onClose, 
  onSave, 
  category,
  isLoading = false
}: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    is_active: CATEGORY_DEFAULTS.DEFAULT_ACTIVE_STATUS
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!category

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        is_active: category.is_active
      })
    } else {
      setFormData({
        name: "",
        description: "",
        is_active: CATEGORY_DEFAULTS.DEFAULT_ACTIVE_STATUS
      })
    }
    setErrors({})
  }, [category, open])

  const handleFieldChange = (updates: Partial<CategoryFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    // Limpar erros dos campos alterados
    if (Object.keys(updates).length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev }
        Object.keys(updates).forEach(key => {
          delete newErrors[key]
        })
        return newErrors
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateCategoryForm(formData)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.errors.forEach(error => {
        const field = error.path[0] as string
        if (field) {
          fieldErrors[field] = error.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    onSave(validation.data)
    if (!isLoading) {
      onClose()
    }
  }

  const handleActionsSubmit = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CategoryFormFields
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
          />

          <CategoryFormActions
            isEditing={isEditing}
            onCancel={onClose}
            onSubmit={handleActionsSubmit}
            isLoading={isLoading}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
