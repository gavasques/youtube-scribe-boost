
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface BlocksTableFiltersProps {
  searchTerm: string
  typeFilter: string
  statusFilter: string
  sortBy: string
  sortOrder: string
  onSearchChange: (value: string) => void
  onTypeChange: (value: string) => void
  onStatusChange: (value: string) => void
  onSortChange: (value: string) => void
}

export function BlocksTableFilters({
  searchTerm,
  typeFilter,
  statusFilter,
  sortBy,
  sortOrder,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onSortChange
}: BlocksTableFiltersProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar blocos..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <select
        className="px-3 py-2 border rounded-md"
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
      >
        <option value="all">Todos os tipos</option>
        <option value="GLOBAL">Global</option>
        <option value="CATEGORY_SPECIFIC">Categoria</option>
        <option value="MANUAL">Descrições dos Vídeos</option>
      </select>
      
      <select
        className="px-3 py-2 border rounded-md"
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="all">Todos os status</option>
        <option value="active">Ativo</option>
        <option value="inactive">Inativo</option>
      </select>

      <select
        className="px-3 py-2 border rounded-md"
        value={`${sortBy}-${sortOrder}`}
        onChange={(e) => onSortChange(e.target.value)}
      >
        <option value="priority-asc">Prioridade (Crescente)</option>
        <option value="priority-desc">Prioridade (Decrescente)</option>
        <option value="name-asc">Nome (A-Z)</option>
        <option value="name-desc">Nome (Z-A)</option>
      </select>
    </div>
  )
}
