
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Plus, Search } from "lucide-react"
import { useState, useMemo } from "react"
import { Prompt, PromptFormData } from "@/types/prompt"
import { PromptCard } from "@/components/Prompts/PromptCard"
import { PromptEditor } from "@/components/Prompts/PromptEditor"
import { usePrompts } from "@/hooks/usePrompts"

export default function Prompts() {
  const { 
    prompts, 
    loading, 
    createPrompt, 
    updatePrompt, 
    togglePromptActive, 
    duplicatePrompt, 
    deletePrompt 
  } = usePrompts()

  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Filtrar prompts usando useMemo para otimização
  const filteredPrompts = useMemo(() => {
    let filtered = prompts

    if (searchTerm) {
      filtered = filtered.filter(prompt => 
        prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(prompt => 
        statusFilter === "active" ? prompt.is_active : !prompt.is_active
      )
    }

    return filtered
  }, [prompts, searchTerm, statusFilter])

  const handleNewPrompt = () => {
    setSelectedPrompt(null)
    setIsEditorOpen(true)
  }

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setIsEditorOpen(true)
  }

  const handleSavePrompt = async (data: PromptFormData) => {
    if (selectedPrompt) {
      await updatePrompt(selectedPrompt.id, data)
    } else {
      await createPrompt(data)
    }
    setIsEditorOpen(false)
  }

  const handleToggleActive = async (prompt: Prompt) => {
    await togglePromptActive(prompt)
  }

  const handleDuplicate = async (prompt: Prompt) => {
    await duplicatePrompt(prompt)
  }

  const handleDelete = async (prompt: Prompt) => {
    await deletePrompt(prompt)
  }

  const getActiveCount = () => {
    return prompts.filter(p => p.is_active).length
  }

  const getTotalCount = () => {
    return prompts.length
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Prompts IA
            </h1>
            <p className="text-muted-foreground">
              Configure os prompts para processamento inteligente de conteúdo
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Carregando prompts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Prompts IA
          </h1>
          <p className="text-muted-foreground">
            Configure os prompts para processamento inteligente de conteúdo
          </p>
        </div>
        <Button onClick={handleNewPrompt} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-0">
          <Plus className="w-4 h-4" />
          Novo Prompt
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="text-lg text-amber-800">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-amber-600" />
              <Input
                placeholder="Buscar prompts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-amber-300 focus:border-amber-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-amber-300 focus:border-amber-500">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Apenas ativos</SelectItem>
                <SelectItem value="inactive">Apenas inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {getActiveCount()}
            </div>
            <div className="text-sm text-muted-foreground">
              Prompts Ativos
            </div>
            <Badge variant="outline" className="mt-1 border-emerald-300 text-emerald-700">
              Em Uso
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              {getTotalCount()}
            </div>
            <div className="text-sm text-muted-foreground">
              Total de Prompts
            </div>
            <Badge variant="outline" className="mt-1 border-blue-300 text-blue-700">
              Criados
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Lista de prompts */}
      <div className="grid gap-4">
        {filteredPrompts.length === 0 ? (
          <Card className="border-amber-200">
            <CardContent className="p-8 text-center">
              <Brain className="w-12 h-12 mx-auto text-amber-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum prompt encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {prompts.length === 0 
                  ? "Você ainda não possui prompts cadastrados."
                  : "Não há prompts que correspondam aos filtros aplicados."
                }
              </p>
              <Button onClick={handleNewPrompt} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 border-0">
                <Plus className="w-4 h-4" />
                {prompts.length === 0 ? "Criar Primeiro Prompt" : "Criar Novo Prompt"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredPrompts.map(prompt => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onEdit={handleEditPrompt}
              onToggleActive={handleToggleActive}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Editor Modal */}
      <PromptEditor
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        prompt={selectedPrompt}
        onSave={handleSavePrompt}
      />
    </div>
  )
}
