
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { BlocksTable } from "@/components/Blocks/BlocksTable"
import { BlockForm } from "@/components/Blocks/BlockForm"
import { useOptimizedBlocks } from "@/hooks/useOptimizedBlocks"
import { useOptimizedCategories } from "@/hooks/useOptimizedCategories"
import { useBlockActions } from "@/hooks/useBlockActions"
import { OptimizedLoading } from "@/components/ui/optimized-loading"
import { BlockUI } from "@/types/block"

export default function Blocks() {
  const { 
    blocks, 
    loading: blocksLoading, 
    createBlock, 
    updateBlock, 
    toggleBlockActive, 
    deleteBlock,
    moveBlockUp,
    moveBlockDown
  } = useOptimizedBlocks()
  
  const { 
    activeCategories, 
    loading: categoriesLoading, 
    fetchCategories 
  } = useOptimizedCategories()
  
  const { validateBlockAction } = useBlockActions()
  
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState<BlockUI | null>(null)

  const handleCreateBlock = async (data: any) => {
    const result = await createBlock(data)
    if (result.data) {
      setShowForm(false)
    }
  }

  const handleEditBlock = async (data: any) => {
    if (!editingBlock) return

    const result = await updateBlock(editingBlock.id, data)
    if (result.data) {
      setEditingBlock(null)
      setShowForm(false)
    }
  }

  const handleToggleActive = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (block && validateBlockAction(block, 'toggle')) {
      await toggleBlockActive(block)
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (block && validateBlockAction(block, 'delete')) {
      await deleteBlock(block)
    }
  }

  const handleEdit = (tableBlock: any) => {
    const originalBlock = blocks.find(b => b.id === tableBlock.id)
    if (originalBlock && validateBlockAction(originalBlock, 'edit')) {
      setEditingBlock(originalBlock)
      setShowForm(true)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingBlock(null)
  }

  const handleFormOpen = () => {
    if (!categoriesLoading) {
      fetchCategories()
    }
    setShowForm(true)
  }

  const convertBlockForForm = useMemo(() => {
    if (!editingBlock) return null
    
    return {
      id: editingBlock.id,
      title: editingBlock.title,
      content: editingBlock.content,
      type: editingBlock.type,
      scope: editingBlock.scope,
      priority: editingBlock.priority,
      isActive: editingBlock.isActive,
      scheduledStart: editingBlock.scheduledStart,
      scheduledEnd: editingBlock.scheduledEnd,
      categories: editingBlock.categories || [],
      videosAffected: 0,
      createdAt: editingBlock.createdAt
    }
  }, [editingBlock])

  if (blocksLoading) {
    return <OptimizedLoading type="blocks" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Blocos
          </h1>
          <p className="text-muted-foreground">
            Gerencie os blocos de conteúdo para suas descrições
          </p>
        </div>
        <Button 
          className="gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 border-0" 
          onClick={handleFormOpen}
        >
          <Plus className="w-4 h-4" />
          Novo Bloco
        </Button>
      </div>

      <BlocksTable
        blocks={blocks}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteBlock}
        onMoveUp={moveBlockUp}
        onMoveDown={moveBlockDown}
      />

      {!blocksLoading && blocks.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Nenhum bloco encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando seu primeiro bloco de conteúdo
          </p>
          <Button onClick={handleFormOpen} className="gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 border-0">
            <Plus className="w-4 h-4" />
            Criar Primeiro Bloco
          </Button>
        </div>
      )}

      <BlockForm
        open={showForm}
        onClose={handleCloseForm}
        onSave={editingBlock ? handleEditBlock : handleCreateBlock}
        block={convertBlockForForm}
        categories={activeCategories}
        categoriesLoading={categoriesLoading}
      />
    </div>
  )
}
