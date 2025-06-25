
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { VideoFilters as VideoFiltersType } from "@/types/video"
import { Category } from "@/types/category"

interface VideoFiltersProps {
  filters: VideoFiltersType
  onFiltersChange: (filters: VideoFiltersType) => void
  categories: Category[]
}

export function VideoFilters({ filters, onFiltersChange, categories }: VideoFiltersProps) {
  const updateFilter = (key: keyof VideoFiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <div className="flex gap-4 items-center flex-wrap">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar vídeos..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10"
        />
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
    </div>
  )
}
