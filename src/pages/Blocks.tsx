
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { BlocksTable } from "@/components/Blocks/BlocksTable"
import { BlockForm } from "@/components/Blocks/BlockForm"
import { useBlocks } from "@/hooks/useBlocks"
import { Block } from "@/types/block"

export default function Blocks() {
  const { 
    blocks, 
    loading, 
    createBlock, 
    updateBlock, 
    toggleBlockActive, 
    duplicateBlock, 
    deleteBlock,
    moveBlockUp,
    moveBlockDown
  } = useBlocks()
  
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState<Block | null>(null)

  const categories = ["Tutoriais", "Programação", "Gaming", "Reviews", "Tecnologia", "Lifestyle"]

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
    if (block) {
      await toggleBlockActive(block)
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (block) {
      await deleteBlock(block)
    }
  }

  const handleMoveUp = async (blockId: string) => {
    await moveBlockUp(blockId)
  }

  const handleMoveDown = async (blockId: string) => {
    await moveBlockDown(blockId)
  }

  const handleEdit = (tableBlock: any) => {
    // Find the original block from the database
    const originalBlock = blocks.find(b => b.id === tableBlock.id)
    if (originalBlock) {
      setEditingBlock(originalBlock)
      setShowForm(true)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingBlock(null)
  }

  // Convert Block from database to the format expected by BlocksTable
  const convertedBlocks = blocks.map(block => ({
    id: block.id,
    title: block.title,
    content: block.content,
    type: block.type as 'GLOBAL' | 'CATEGORY' | 'MANUAL',
    scope: block.scope as 'PERMANENT' | 'SCHEDULED',
    priority: block.priority,
    isActive: block.is_active,
    scheduledStart: block.scheduled_start || undefined,
    scheduledEnd: block.scheduled_end || undefined,
    categories: [], // Placeholder - categories would need to be implemented
    createdAt: block.created_at,
    videoId: block.video_id || undefined,
    videoTitle: (block as any).videos?.title || undefined,
    videoDescription: (block as any).videos?.current_description || (block as any).videos?.ai_description || undefined
  }))

  // Convert database Block to UI format for BlockForm
  const convertBlockForForm = (block: Block) => ({
    id: block.id,
    title: block.title,
    content: block.content,
    type: block.type,
    scope: block.scope,
    priority: block.priority,
    isActive: block.is_active,
    scheduledStart: block.scheduled_start || undefined,
    scheduledEnd: block.scheduled_end || undefined,
    categories: [], // Placeholder - categories would need to be implemented
    videosAffected: 0, // Placeholder - would need to be calculated
    createdAt: block.created_at
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando blocos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Blocos
          </h1>
          <p className="text-muted-foreground">
            Gerencie os blocos de conteúdo para suas descrições
          </p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 border-0" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Novo Bloco
        </Button>
      </div>

      {/* Content - Apenas tabela */}
      <BlocksTable
        blocks={convertedBlocks}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteBlock}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />

      {/* Empty State */}
      {!loading && blocks.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Nenhum bloco encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando seu primeiro bloco de conteúdo
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 border-0">
            <Plus className="w-4 h-4" />
            Criar Primeiro Bloco
          </Button>
        </div>
      )}

      {/* Form Modal */}
      <BlockForm
        open={showForm}
        onClose={handleCloseForm}
        onSave={editingBlock ? handleEditBlock : handleCreateBlock}
        block={editingBlock ? convertBlockForForm(editingBlock) : null}
        categories={categories}
      />
    </div>
  )
}
