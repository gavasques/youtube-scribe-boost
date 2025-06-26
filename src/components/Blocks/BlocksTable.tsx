
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react"
import { BlockUI } from "@/types/block"
import { useBlockFilters } from "@/hooks/useBlockFilters"
import { BlocksTableFilters } from "./BlocksTable/BlocksTableFilters"
import { BlocksTableRow } from "./BlocksTable/BlocksTableRow"

interface BlocksTableProps {
  blocks: BlockUI[]
  onEdit: (block: BlockUI) => void
  onToggleActive: (blockId: string) => void
  onDelete: (blockId: string) => void
  onMoveUp: (blockId: string) => void
  onMoveDown: (blockId: string) => void
}

export function BlocksTable({ blocks, onEdit, onToggleActive, onDelete, onMoveUp, onMoveDown }: BlocksTableProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())
  
  const {
    filters,
    filteredAndSortedBlocks,
    updateFilter,
    toggleSort
  } = useBlockFilters(blocks)

  const toggleBlockExpansion = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks)
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId)
    } else {
      newExpanded.add(blockId)
    }
    setExpandedBlocks(newExpanded)
  }

  const getSortIcon = (field: 'priority' | 'name') => {
    if (filters.sortBy !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    return filters.sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-')
    updateFilter('sortBy', field)
    updateFilter('sortOrder', order)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Blocos</CardTitle>
        <CardDescription>
          {filteredAndSortedBlocks.length} de {blocks.length} blocos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <BlocksTableFilters
          searchTerm={filters.searchTerm}
          typeFilter={filters.typeFilter}
          statusFilter={filters.statusFilter}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSearchChange={(value) => updateFilter('searchTerm', value)}
          onTypeChange={(value) => updateFilter('typeFilter', value)}
          onStatusChange={(value) => updateFilter('statusFilter', value)}
          onSortChange={handleSortChange}
        />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('name')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Nome
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('priority')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Prioridade
                    {getSortIcon('priority')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedBlocks.map((block) => (
                <BlocksTableRow
                  key={block.id}
                  block={block}
                  isExpanded={expandedBlocks.has(block.id)}
                  onEdit={onEdit}
                  onToggleActive={onToggleActive}
                  onDelete={onDelete}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onToggleExpansion={toggleBlockExpansion}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredAndSortedBlocks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum bloco encontrado
          </div>
        )}
      </CardContent>
    </Card>
  )
}
