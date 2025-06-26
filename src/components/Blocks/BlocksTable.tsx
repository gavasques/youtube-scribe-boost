
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Power, Trash, Calendar, Globe, FolderTree, ChevronUp, ChevronDown } from "lucide-react"

export interface Block {
  id: string
  title: string
  description?: string
  content: string
  type: 'GLOBAL' | 'CATEGORY'
  scope: 'PERMANENT' | 'SCHEDULED'
  priority: number
  isActive: boolean
  scheduledStart?: string
  scheduledEnd?: string
  categories: string[]
  createdAt: string
}

interface BlocksTableProps {
  blocks: Block[]
  onEdit: (block: Block) => void
  onToggleActive: (blockId: string) => void
  onDelete: (blockId: string) => void
  onMoveUp: (blockId: string) => void
  onMoveDown: (blockId: string) => void
}

export function BlocksTable({ blocks, onEdit, onToggleActive, onDelete, onMoveUp, onMoveDown }: BlocksTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredBlocks = blocks.filter(block => {
    const matchesSearch = block.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || block.type === typeFilter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && block.isActive) ||
      (statusFilter === "inactive" && !block.isActive)
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeBadge = (type: string) => {
    return type === "GLOBAL" ? (
      <Badge variant="default" className="gap-1">
        <Globe className="w-3 h-3" />
        Global
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <FolderTree className="w-3 h-3" />
        Categoria
      </Badge>
    )
  }

  const getScopeBadge = (block: Block) => {
    if (block.scope === "PERMANENT") {
      return <Badge variant="secondary">Permanente</Badge>
    }
    
    return (
      <Badge variant="outline" className="gap-1">
        <Calendar className="w-3 h-3" />
        {block.scheduledStart} - {block.scheduledEnd}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Blocos</CardTitle>
        <CardDescription>
          {filteredBlocks.length} de {blocks.length} blocos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar blocos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-3 py-2 border rounded-md"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Todos os tipos</option>
            <option value="GLOBAL">Global</option>
            <option value="CATEGORY">Categoria</option>
          </select>
          
          <select
            className="px-3 py-2 border rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBlocks.map((block, index) => (
                <TableRow key={block.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{block.title}</div>
                      {block.description && (
                        <div className="text-sm text-muted-foreground">
                          {block.description}
                        </div>
                      )}
                      {block.categories.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {block.categories.map((category) => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(block.type)}</TableCell>
                  <TableCell>
                    <Badge variant={block.isActive ? "default" : "secondary"}>
                      {block.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{getScopeBadge(block)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveUp(block.id)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveDown(block.id)}
                        disabled={index === filteredBlocks.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(block)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleActive(block.id)}>
                          <Power className="w-4 h-4 mr-2" />
                          {block.isActive ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(block.id)}
                          className="text-destructive"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredBlocks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum bloco encontrado
          </div>
        )}
      </CardContent>
    </Card>
  )
}
