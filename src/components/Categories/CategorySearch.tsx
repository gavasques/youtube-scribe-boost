
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface CategorySearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CategorySearch({ 
  value, 
  onChange, 
  placeholder = "Buscar categorias..." 
}: CategorySearchProps) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}
