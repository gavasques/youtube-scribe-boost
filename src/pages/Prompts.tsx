
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Plus, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { Prompt, PromptFormData, PromptType } from "@/types/prompt"
import { PromptCard } from "@/components/Prompts/PromptCard"
import { PromptEditor } from "@/components/Prompts/PromptEditor"
import { useToast } from "@/hooks/use-toast"

// Dados mockados com prompts padrão
const mockPrompts: Prompt[] = [
  {
    id: "1",
    name: "Gerador de Resumo Padrão",
    description: "Cria resumos estruturados e envolventes a partir de transcrições de vídeos",
    type: "SUMMARY_GENERATOR",
    system_prompt: "Você é um especialista em síntese de conteúdo audiovisual. Sua tarefa é criar resumos concisos e envolventes que capturem os pontos principais do vídeo, mantendo o tom e estilo do criador de conteúdo.",
    user_prompt: "Analise a transcrição fornecida e crie um resumo estruturado em formato de tópicos. O resumo deve:\n\n1. Capturar os pontos principais do vídeo\n2. Manter o tom do criador\n3. Ser conciso mas informativo\n4. Usar emojis quando apropriado\n\nTranscrição:\n{transcription}",
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 0.9,
    is_active: true,
    version: "1.0",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    name: "Gerador de Capítulos Avançado", 
    description: "Identifica seções do vídeo e cria capítulos com timestamps precisos",
    type: "CHAPTER_GENERATOR",
    system_prompt: "Você é um especialista em criação de capítulos para vídeos no YouTube. Analise o conteúdo e identifique mudanças naturais de tópico para criar capítulos úteis.",
    user_prompt: "Crie capítulos no formato timestamp para este vídeo. Analise a transcrição e identifique seções distintas. Formato:\n\n00:00 Introdução\n05:30 Tópico Principal\n12:15 Exemplos Práticos\n\nTranscrição:\n{transcription}",
    temperature: 0.3,
    max_tokens: 800,
    top_p: 0.8,
    is_active: true,
    version: "1.2",
    created_at: "2024-01-10T14:30:00Z",
    updated_at: "2024-01-20T09:15:00Z"
  },
  {
    id: "3",
    name: "Descrição Otimizada para YouTube",
    description: "Gera descrições otimizadas para SEO e engajamento no YouTube",
    type: "DESCRIPTION_GENERATOR", 
    system_prompt: "Você é um especialista em copywriting para YouTube e otimização SEO. Crie descrições que aumentem o engajamento e a descoberta do vídeo.",
    user_prompt: "Crie uma descrição envolvente para YouTube baseada na transcrição. A descrição deve:\n\n- Ter um gancho inicial forte\n- Incluir palavras-chave relevantes\n- Ter call-to-action claro\n- Ser estruturada e fácil de ler\n\nTranscrição:\n{transcription}",
    temperature: 0.8,
    max_tokens: 1200,
    top_p: 0.9,
    is_active: false,
    version: "2.0",
    created_at: "2024-01-05T16:45:00Z",
    updated_at: "2024-01-25T11:20:00Z"
  },
  {
    id: "4",
    name: "Tags SEO Inteligentes",
    description: "Gera tags relevantes e otimizadas baseadas no conteúdo do vídeo",
    type: "TAG_GENERATOR",
    system_prompt: "Você é um especialista em SEO para YouTube. Gere tags que ajudem na descoberta do vídeo, combinando palavras-chave populares com termos específicos do nicho.",
    user_prompt: "Gere tags relevantes baseadas na transcrição do vídeo. Inclua:\n\n- Tags principais (3-5)\n- Tags secundárias (5-8) \n- Tags de nicho específico\n- Variações de palavras-chave\n\nFormate como lista separada por vírgulas.\n\nTranscrição:\n{transcription}",
    temperature: 0.5,
    max_tokens: 500,
    top_p: 0.7,
    is_active: true,
    version: "1.1", 
    created_at: "2024-01-12T08:20:00Z",
    updated_at: "2024-01-18T14:10:00Z"
  }
]

export default function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>(mockPrompts)
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>(mockPrompts)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  const promptTypes = [
    { value: "SUMMARY_GENERATOR", label: "Gerador de Resumo" },
    { value: "CHAPTER_GENERATOR", label: "Gerador de Capítulos" },
    { value: "DESCRIPTION_GENERATOR", label: "Gerador de Descrição" },
    { value: "TAG_GENERATOR", label: "Gerador de Tags" },
    { value: "CATEGORY_CLASSIFIER", label: "Classificador de Categoria" },
  ]

  // Filtrar prompts
  const applyFilters = () => {
    let filtered = prompts

    if (searchTerm) {
      filtered = filtered.filter(prompt => 
        prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(prompt => prompt.type === typeFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(prompt => 
        statusFilter === "active" ? prompt.is_active : !prompt.is_active
      )
    }

    setFilteredPrompts(filtered)
  }

  // Aplicar filtros quando mudarem
  useEffect(() => {
    applyFilters()
  }, [searchTerm, typeFilter, statusFilter, prompts])

  const handleNewPrompt = () => {
    setSelectedPrompt(null)
    setIsEditorOpen(true)
  }

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setIsEditorOpen(true)
  }

  const handleSavePrompt = (data: PromptFormData) => {
    if (selectedPrompt) {
      // Editar prompt existente
      setPrompts(prev => prev.map(p => 
        p.id === selectedPrompt.id 
          ? {
              ...p,
              ...data,
              updated_at: new Date().toISOString(),
              version: String(parseFloat(p.version) + 0.1)
            }
          : p
      ))
    } else {
      // Criar novo prompt
      const newPrompt: Prompt = {
        id: String(Date.now()),
        ...data,
        is_active: false,
        version: "1.0",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setPrompts(prev => [...prev, newPrompt])
    }
    applyFilters()
  }

  const handleToggleActive = (prompt: Prompt) => {
    // Se estiver ativando, desativar outros do mesmo tipo
    if (!prompt.is_active) {
      setPrompts(prev => prev.map(p => 
        p.type === prompt.type && p.id !== prompt.id
          ? { ...p, is_active: false }
          : p.id === prompt.id 
          ? { ...p, is_active: true }
          : p
      ))
    } else {
      setPrompts(prev => prev.map(p => 
        p.id === prompt.id ? { ...p, is_active: false } : p
      ))
    }
    applyFilters()
    toast({
      title: prompt.is_active ? "Prompt desativado" : "Prompt ativado",
      description: !prompt.is_active ? "Outros prompts do mesmo tipo foram desativados." : "",
    })
  }

  const handleDuplicate = (prompt: Prompt) => {
    const duplicatedPrompt: Prompt = {
      ...prompt,
      id: String(Date.now()),
      name: `${prompt.name} (Cópia)`,
      is_active: false,
      version: "1.0",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setPrompts(prev => [...prev, duplicatedPrompt])
    applyFilters()
    toast({
      title: "Prompt duplicado",
      description: "Uma cópia do prompt foi criada e está inativa.",
    })
  }

  const getActiveCount = (type: PromptType) => {
    return prompts.filter(p => p.type === type && p.is_active).length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompts IA</h1>
          <p className="text-muted-foreground">
            Configure os prompts para processamento inteligente de conteúdo
          </p>
        </div>
        <Button onClick={handleNewPrompt} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Prompt
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar prompts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de prompt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {promptTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
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

      {/* Estatísticas por tipo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {promptTypes.map(type => (
          <Card key={type.value}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getActiveCount(type.value as PromptType)}
              </div>
              <div className="text-sm text-muted-foreground">
                {type.label}
              </div>
              <Badge variant="outline" className="mt-1">
                Ativo
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de prompts */}
      <div className="grid gap-4">
        {filteredPrompts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum prompt encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Não há prompts que correspondam aos filtros aplicados.
              </p>
              <Button onClick={handleNewPrompt} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeiro Prompt
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
