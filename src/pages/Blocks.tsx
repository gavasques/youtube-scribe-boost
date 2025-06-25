
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { BlocksTable, Block } from "@/components/Blocks/BlocksTable"
import { BlockForm } from "@/components/Blocks/BlockForm"
import { BlockPreview } from "@/components/Blocks/BlockPreview"
import { useToast } from "@/hooks/use-toast"

export default function Blocks() {
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState<Block | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Mock data
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: "1",
      title: "CTA Principal",
      description: "Call-to-action principal para inscrições",
      type: "GLOBAL",
      scope: "PERMANENT",
      content: "🔔 Inscreva-se no canal e ative o sininho para não perder nenhum vídeo!",
      categories: [],
      isActive: true,
      priority: 10,
      videosAffected: 45,
      createdAt: "2024-06-15"
    },
    {
      id: "2",
      title: "Links Redes Sociais",
      description: "Links para todas as redes sociais",
      type: "GLOBAL",
      scope: "PERMANENT",
      content: "📱 Me siga nas redes:\n- Instagram: @meucanal\n- Twitter: @meucanal\n- TikTok: @meucanal",
      categories: [],
      isActive: true,
      priority: 5,
      videosAffected: 45,
      createdAt: "2024-06-10"
    },
    {
      id: "3",
      title: "Promoção Black Friday",
      description: "Promoção especial de fim de ano",
      type: "GLOBAL",
      scope: "SCHEDULED",
      content: "🔥 BLACK FRIDAY: 50% OFF em todos os cursos até 30/11!\n🎯 Use o cupom: BLACK50",
      categories: [],
      isActive: false,
      priority: 20,
      scheduledStart: "2024-11-20",
      scheduledEnd: "2024-11-30",
      videosAffected: 0,
      createdAt: "2024-06-01"
    },
    {
      id: "4",
      title: "Tutorial Específico",
      description: "Links específicos para tutoriais",
      type: "CATEGORY",
      scope: "PERMANENT",
      content: "📚 Mais tutoriais na playlist: [LINK]\n💻 Código no GitHub: [LINK]",
      categories: ["Tutoriais", "Programação"],
      isActive: true,
      priority: 15,
      videosAffected: 12,
      createdAt: "2024-05-28"
    },
    {
      id: "5",
      title: "Gaming CTA",
      description: "Call-to-action específico para gaming",
      type: "CATEGORY",
      scope: "PERMANENT",
      content: "🎮 Deixe seu like se curtiu a gameplay!\n🏆 Comenta aí qual jogo querem ver!",
      categories: ["Gaming", "Reviews"],
      isActive: true,
      priority: 8,
      videosAffected: 8,
      createdAt: "2024-05-20"
    }
  ])

  const categories = ["Tutoriais", "Programação", "Gaming", "Reviews", "Tecnologia", "Lifestyle"]

  const handleCreateBlock = (data: any) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      content: data.content,
      type: data.type,
      scope: data.scope,
      priority: data.priority,
      categories: data.categories,
      isActive: true,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      videosAffected: data.applyToExisting ? 45 : 0,
      createdAt: new Date().toISOString().split('T')[0]
    }

    setBlocks([...blocks, newBlock])
    toast({
      title: "Bloco criado com sucesso!",
      description: `O bloco "${data.title}" foi criado e está ativo.`,
    })
  }

  const handleEditBlock = (data: any) => {
    if (!editingBlock) return

    const updatedBlocks = blocks.map(block =>
      block.id === editingBlock.id
        ? {
            ...block,
            title: data.title,
            description: data.description,
            content: data.content,
            type: data.type,
            scope: data.scope,
            priority: data.priority,
            categories: data.categories,
            scheduledStart: data.scheduledStart,
            scheduledEnd: data.scheduledEnd,
          }
        : block
    )

    setBlocks(updatedBlocks)
    setEditingBlock(null)
    toast({
      title: "Bloco atualizado!",
      description: `As alterações no bloco "${data.title}" foram salvas.`,
    })
  }

  const handleToggleActive = (blockId: string) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId
        ? { ...block, isActive: !block.isActive }
        : block
    )
    setBlocks(updatedBlocks)

    const block = blocks.find(b => b.id === blockId)
    toast({
      title: `Bloco ${block?.isActive ? 'desativado' : 'ativado'}!`,
      description: `O bloco "${block?.title}" foi ${block?.isActive ? 'desativado' : 'ativado'}.`,
    })
  }

  const handleDeleteBlock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId)
    setBlocks(blocks.filter(b => b.id !== blockId))
    toast({
      title: "Bloco excluído!",
      description: `O bloco "${block?.title}" foi removido permanentemente.`,
      variant: "destructive",
    })
  }

  const handleEdit = (block: Block) => {
    setEditingBlock(block)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingBlock(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blocos</h1>
          <p className="text-muted-foreground">
            Gerencie os blocos de conteúdo para suas descrições
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
          >
            {viewMode === 'table' ? 'Ver em Grade' : 'Ver em Tabela'}
          </Button>
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Novo Bloco
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <BlocksTable
          blocks={blocks}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          onDelete={handleDeleteBlock}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block) => (
            <BlockPreview key={block.id} block={block} />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <BlockForm
        open={showForm}
        onClose={handleCloseForm}
        onSave={editingBlock ? handleEditBlock : handleCreateBlock}
        block={editingBlock}
        categories={categories}
      />
    </div>
  )
}
