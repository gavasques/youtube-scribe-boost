
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { CategoryFormData } from "@/types/category"
import { CATEGORY_FORM_CONFIG } from "@/utils/categoryConstants"

interface CategoryFormFieldsProps {
  formData: CategoryFormData
  onChange: (data: Partial<CategoryFormData>) => void
  errors: Record<string, string>
}

export function CategoryFormFields({ formData, onChange, errors }: CategoryFormFieldsProps) {
  const { FIELDS } = CATEGORY_FORM_CONFIG

  return (
    <div className="space-y-4">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor={FIELDS.NAME.id}>
          {FIELDS.NAME.label} {FIELDS.NAME.required && '*'}
        </Label>
        <Input
          id={FIELDS.NAME.id}
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={FIELDS.NAME.placeholder}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor={FIELDS.DESCRIPTION.id}>{FIELDS.DESCRIPTION.label}</Label>
        <Textarea
          id={FIELDS.DESCRIPTION.id}
          value={formData.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={FIELDS.DESCRIPTION.placeholder}
          rows={FIELDS.DESCRIPTION.rows}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center space-x-2">
        <Switch
          id={FIELDS.ACTIVE.id}
          checked={formData.is_active ?? true}
          onCheckedChange={(checked) => onChange({ is_active: checked })}
        />
        <Label htmlFor={FIELDS.ACTIVE.id}>{FIELDS.ACTIVE.label}</Label>
      </div>
    </div>
  )
}
