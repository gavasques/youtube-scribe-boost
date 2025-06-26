
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  Edit, 
  Power, 
  Trash, 
  ChevronUp, 
  ChevronDown,
  ChevronRight,
  Info,
  Lock
} from "lucide-react"
import { BlockUI } from "@/types/block"
import { BlockTypeBadge, BlockStatusBadge, BlockScopeBadge } from "../BlockBadges"
import { getBlockContent } from "@/utils/blockValidation"
import { canEditBlock, canDeleteBlock, canToggleBlock } from "@/utils/blockConstants"

interface BlocksTableRowProps {
  block: BlockUI
  isExpanded: boolean
  onEdit: (block: BlockUI) => void
  onToggleActive: (blockId: string) => void
  onDelete: (blockId: string) => void
  onMoveUp: (blockId: string) => void
  onMoveDown: (blockId: string) => void
  onToggleExpansion: (blockId: string) => void
}

export function BlocksTableRow({
  block,
  isExpanded,
  onEdit,
  onToggleActive,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleExpansion
}: BlocksTableRowProps) {
  return (
    <>
      <TableRow className={block.type === 'MANUAL' ? 'bg-blue-50/50' : ''}>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpansion(block.id)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {block.type === 'MANUAL' && <Info className="w-4 h-4 text-blue-500" />}
            <div>
              <div className="font-medium">{block.title}</div>
              {block.type === 'MANUAL' && (
                <div className="text-sm text-blue-600">
                  Posição das descrições na compilação
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
        <TableCell>
          <BlockTypeBadge type={block.type} />
        </TableCell>
        <TableCell>
          <BlockStatusBadge isActive={block.isActive} type={block.type} />
        </TableCell>
        <TableCell>
          <BlockScopeBadge block={block} />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <span className="text-sm font-mono">{block.priority}</span>
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMoveUp(block.id)}
                className="h-4 w-4 p-0"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMoveDown(block.id)}
                className="h-4 w-4 p-0"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
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
              {canEditBlock(block.type) && (
                <DropdownMenuItem onClick={() => onEdit(block)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {canToggleBlock(block.type) && (
                <DropdownMenuItem onClick={() => onToggleActive(block.id)}>
                  <Power className="w-4 h-4 mr-2" />
                  {block.isActive ? "Desativar" : "Ativar"}
                </DropdownMenuItem>
              )}
              {canDeleteBlock(block.type) && (
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
                  Bloco gerenciado pelo sistema
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell></TableCell>
          <TableCell colSpan={6}>
            <div className={`p-4 rounded-md ${block.type === 'MANUAL' ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <div className="text-sm font-medium text-gray-700 mb-2">
                {block.type === 'MANUAL' ? 'Função do Bloco:' : 'Conteúdo do Bloco:'}
              </div>
              <div className="text-sm text-gray-600 whitespace-pre-wrap border p-3 bg-white rounded">
                {getBlockContent(block)}
              </div>
              {block.type === 'MANUAL' && (
                <div className="text-xs text-blue-600 mt-2">
                  💡 <strong>Dica:</strong> Mova este bloco para cima ou para baixo para definir onde as descrições dos vídeos aparecem em relação aos outros blocos. Altere a prioridade para reordenar.
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
