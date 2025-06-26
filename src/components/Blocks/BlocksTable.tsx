
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
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Power, 
  Trash, 
  Calendar, 
  Globe, 
  FolderTree, 
  ChevronUp, 
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileText,
  Lock
} from "lucide-react"

export interface Block {
  id: string
  title: string
  content: string
  type: 'GLOBAL' | 'CATEGORY' | 'MANUAL'
  scope: 'PERMANENT' | 'SCHEDULED'
  priority: number
  isActive: boolean
  scheduledStart?: string
  scheduledEnd?: string
  categories: string[]
  createdAt: string
  videoId?: string
  videoTitle?: string
  videoDescription?: string
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
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())

  const filteredBlocks = blocks.filter(block => {
    const matchesSearch = block.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || block.type === typeFilter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && block.isActive) ||
      (statusFilter === "inactive" && !block.isActive)
    
    return matchesSearch && matchesType && matchesStatus
  })

  const toggleBlockExpansion = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks)
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId)
    } else {
      newExpanded.add(blockId)
    }
    setExpandedBlocks(newExpanded)
  }

  const getTypeBadge = (type: string) => {
    if (type === "GLOBAL") {
      return (
        <Badge variant="default" className="gap-1">
          <Globe className="w-3 h-3" />
          Global
        </Badge>
      )
    } else if (type === "MANUAL") {
      return (
        <Badge variant="outline" className="gap-1 border-blue-500 text-blue-700">
          <FileText className="w-3 h-3" />
          Manual
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="gap-1">
          <FolderTree className="w-3 h-3" />
          Categoria
        </Badge>
      )
    }
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

  const getBlockContent = (block: Block) => {
    if (block.type === 'MANUAL') {
      return block.videoDescription || 'Descrição do vídeo não disponível'
    }
    return block.content
  }

  const canEdit = (block: Block) => block.type !== 'MANUAL'
  const canDelete = (block: Block) => block.type !== 'MANUAL'
  const canToggleActive = (block: Block) => block.type !== 'MANUAL'

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
            <option value="MANUAL">Manual</option>
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
                <TableHead className="w-12"></TableHead>
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
                <>
                  <TableRow key={block.id} className={block.type === 'MANUAL' ? 'bg-blue-50/50' : ''}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBlockExpansion(block.id)}
                        className="h-6 w-6 p-0"
                      >
                        {expandedBlocks.has(block.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {block.type === 'MANUAL' && <Lock className="w-4 h-4 text-gray-500" />}
                        <div>
                          <div className="font-medium">{block.title}</div>
                          {block.type === 'MANUAL' && block.videoTitle && (
                            <div className="text-sm text-gray-500">
                              Vídeo: {block.videoTitle}
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
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(block.type)}</TableCell>
                    <TableCell>
                      {block.type === 'MANUAL' ? (
                        <Badge variant="default" className="bg-blue-600">
                          Sempre Ativo
                        </Badge>
                      ) : (
                        <Badge variant={block.isActive ? "default" : "secondary"}>
                          {block.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      )}
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
                          {canEdit(block) && (
                            <DropdownMenuItem onClick={() => onEdit(block)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {canToggleActive(block) && (
                            <DropdownMenuItem onClick={() => onToggleActive(block.id)}>
                              <Power className="w-4 h-4 mr-2" />
                              {block.isActive ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                          )}
                          {canDelete(block) && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(block.id)}
                              className="text-destructive"
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                          {block.type === 'MANUAL' && (
                            <DropdownMenuItem disabled>
                              <Lock className="w-4 h-4 mr-2" />
                              Bloco protegido
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedBlocks.has(block.id) && (
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell colSpan={6}>
                        <div className={`p-4 rounded-md ${block.type === 'MANUAL' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            {block.type === 'MANUAL' ? 'Conteúdo da Descrição do Vídeo:' : 'Conteúdo do Bloco:'}
                          </div>
                          <div className="text-sm text-gray-600 whitespace-pre-wrap border p-3 bg-white rounded">
                            {getBlockContent(block)}
                          </div>
                          {block.type === 'MANUAL' && (
                            <div className="text-xs text-blue-600 mt-2">
                              ℹ️ Este bloco representa a descrição atual do vídeo vinculado
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
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
