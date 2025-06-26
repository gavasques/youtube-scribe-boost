
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Shield, EyeOff } from "lucide-react"
import { VideoFilters as VideoFiltersType } from "@/types/video"
import { Category } from "@/types/category"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useEffect } from "react"
import { sanitizeHtml } from "@/lib/validation"

const videoFiltersSchema = z.object({
  search: z.string()
    .max(100, "Search term too long")
    .transform(sanitizeHtml),
  configuration_status: z.enum(["all", "CONFIGURED", "NOT_CONFIGURED", "NEEDS_ATTENTION"]),
  update_status: z.enum(["all", "ACTIVE_FOR_UPDATE", "DO_NOT_UPDATE", "IGNORED"]),
  category_id: z.string(),
  video_type: z.enum(["all", "REGULAR", "SHORT"])
})

type VideoFiltersForm = z.infer<typeof videoFiltersSchema>

interface VideoFiltersProps {
  filters: VideoFiltersType
  onFiltersChange: (filters: VideoFiltersType) => void
  categories: Category[]
  showIgnored: boolean
  onShowIgnoredChange: (show: boolean) => void
}

export function VideoFilters({ filters, onFiltersChange, categories, showIgnored, onShowIgnoredChange }: VideoFiltersProps) {
  // Convert VideoFiltersType to the form schema type
  const formDefaults: VideoFiltersForm = {
    search: filters.search,
    configuration_status: filters.configuration_status as VideoFiltersForm["configuration_status"],
    update_status: filters.update_status as VideoFiltersForm["update_status"],
    category_id: filters.category_id,
    video_type: filters.video_type as VideoFiltersForm["video_type"]
  }

  const form = useForm<VideoFiltersForm>({
    resolver: zodResolver(videoFiltersSchema),
    defaultValues: formDefaults,
    mode: "onChange"
  })

  const { watch, formState: { isValid, errors } } = form

  // Watch for changes and update parent component
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (isValid && name) {
        // Only update if validation passes
        const validatedData = videoFiltersSchema.safeParse(value)
        if (validatedData.success) {
          onFiltersChange(validatedData.data as VideoFiltersType)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, isValid, onFiltersChange])

  const updateFilter = (key: keyof VideoFiltersType, value: string) => {
    const newFilters = { ...filters, [key]: value }
    const validatedData = videoFiltersSchema.safeParse(newFilters)
    
    if (validatedData.success) {
      onFiltersChange(validatedData.data as VideoFiltersType)
      form.setValue(key as keyof VideoFiltersForm, value as any)
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="space-y-3">
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar vídeos..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className={`pl-10 ${errors.search ? 'border-red-500' : ''}`}
            maxLength={100}
          />
          {errors.search && (
            <div className="text-xs text-red-600 mt-1">{errors.search.message}</div>
          )}
        </div>

        <Select value={filters.configuration_status} onValueChange={(value) => updateFilter('configuration_status', value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status de configuração" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="CONFIGURED">Configurado</SelectItem>
            <SelectItem value="NOT_CONFIGURED">Não configurado</SelectItem>
            <SelectItem value="NEEDS_ATTENTION">Requer atenção</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.update_status} onValueChange={(value) => updateFilter('update_status', value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status de atualização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ACTIVE_FOR_UPDATE">Ativo</SelectItem>
            <SelectItem value="DO_NOT_UPDATE">Não atualizar</SelectItem>
            <SelectItem value="IGNORED">Ignorado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.category_id} onValueChange={(value) => updateFilter('category_id', value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="uncategorized">Sem categoria</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.video_type} onValueChange={(value) => updateFilter('video_type', value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="REGULAR">Regular</SelectItem>
            <SelectItem value="SHORT">Short</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2 border rounded-md p-2">
          <Checkbox 
            id="show-ignored" 
            checked={showIgnored}
            onCheckedChange={onShowIgnoredChange}
          />
          <Label htmlFor="show-ignored" className="flex items-center gap-2 text-sm">
            <EyeOff className="w-4 h-4" />
            Ver Ignorados
          </Label>
        </div>
      </div>

      {/* Security indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className={`w-4 h-4 ${isValid && !hasErrors ? 'text-green-600' : 'text-yellow-600'}`} />
          <Badge 
            variant="outline" 
            className={isValid && !hasErrors ? 'text-green-700 border-green-300' : 'text-yellow-700 border-yellow-300'}
          >
            {isValid && !hasErrors ? 'Filters validated' : 'Validating...'}
          </Badge>
        </div>
        
        {hasErrors && (
          <div className="text-xs text-red-600">
            {Object.values(errors).map(error => error?.message).join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}
