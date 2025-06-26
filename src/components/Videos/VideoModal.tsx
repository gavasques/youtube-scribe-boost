import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Upload, Play, FileText, Brain, Eye, ExternalLink, Zap } from "lucide-react"
import { Video, VideoFormData } from "@/types/video"
import { Category } from "@/types/category"
import { TranscriptionUpload } from "./TranscriptionUpload"
import { AIProcessingSettings } from "./AIProcessingSettings"
import { DescriptionCompiler } from "./DescriptionCompiler"
import { useAIProcessing } from "@/hooks/useAIProcessing"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface VideoModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: VideoFormData) => void
  video?: Video | null
  categories: Category[]
  onVideoUpdate?: () => void // Nova prop para atualizar a lista
}

export function VideoModal({ open, onClose, onSave, video, categories, onVideoUpdate }: VideoModalProps) {
  const [formData, setFormData] = useState<VideoFormData>({
    title: "",
    youtube_url: "",
    youtube_id: "",
    video_type: "REGULAR",
    category_id: "",
    update_status: "ACTIVE_FOR_UPDATE",
    transcription: ""
  })

  const [transcriptionText, setTranscriptionText] = useState("")
  const [savingCategory, setSavingCategory] = useState(false)
  const { processing, progress, processWithAI, uploadTranscription } = useAIProcessing()
  const { toast } = useToast()

  // Estado para configurações de processamento IA
  const [aiConfig, setAiConfig] = useState({
    summary: true,
    chapters: true,
    description: true,
    tags: true,
    category: false,
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000
  })

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title,
        youtube_url: video.youtube_url,
        youtube_id: video.youtube_id,
        video_type: video.video_type,
        category_id: video.category_id || "",
        update_status: video.update_status,
        transcription: video.transcription || ""
      })
      setTranscriptionText(video.transcription || "")
    } else {
      setFormData({
        title: "",
        youtube_url: "",
        youtube_id: "",
        video_type: "REGULAR",
        category_id: "",
        update_status: "ACTIVE_FOR_UPDATE",
        transcription: ""
      })
      setTranscriptionText("")
    }
  }, [video, open])

  const handleCategoryChange = async (categoryId: string) => {
    if (!video) return

    setSavingCategory(true)
    
    try {
      const newCategoryId = categoryId === "none" ? null : categoryId

      // Atualizar no banco de dados
      const { error } = await supabase
        .from('videos')
        .update({ 
          category_id: newCategoryId,
          updated_at: new Date().toISOString()
        })
        .eq('id', video.id)

      if (error) throw error

      // Atualizar estado local
      setFormData(prev => ({ ...prev, category_id: categoryId === "none" ? "" : categoryId }))

      // Atualizar a lista de vídeos na página principal
      if (onVideoUpdate) {
        onVideoUpdate()
      }

      // Mostrar confirmação
      toast({
        title: "Categoria atualizada!",
        description: `Categoria ${categoryId === "none" ? "removida" : "alterada"} com sucesso.`,
      })

    } catch (error) {
      console.error('Erro ao atualizar categoria:', error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a categoria do vídeo",
        variant: "destructive"
      })
    } finally {
      setSavingCategory(false)
    }
  }

  const handleUpdateStatusChange = async (newStatus: string) => {
    if (!video) return

    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('videos')
        .update({ 
          update_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', video.id)

      if (error) throw error

      // Atualizar estado local
      setFormData(prev => ({ ...prev, update_status: newStatus as any }))

      // Atualizar a lista de vídeos na página principal
      if (onVideoUpdate) {
        onVideoUpdate()
      }

      // Mostrar confirmação
      toast({
        title: "Status atualizado!",
        description: "Status de atualização alterado com sucesso.",
      })

    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status do vídeo",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      transcription: transcriptionText
    })
    onClose()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIGURED":
        return <Badge variant="default" className="bg-green-100 text-green-800">Configurado</Badge>
      case "NEEDS_ATTENTION":
        return <Badge variant="destructive">Requer Atenção</Badge>
      default:
        return <Badge variant="secondary">Não Configurado</Badge>
    }
  }

  const handleAIProcessing = async () => {
    if (!video || !transcriptionText) return

    try {
      // Buscar prompts ativos do banco (por simplicidade, usando prompts padrão)
      const prompts: any = {}
      
      if (aiConfig.summary) {
        prompts.summary = "Crie um resumo conciso e informativo do vídeo baseado na transcrição. Destaque os pontos principais em parágrafos estruturados."
      }
      
      if (aiConfig.chapters) {
        prompts.chapters = "Analise a transcrição e crie capítulos com timestamps. Retorne como JSON array com objetos {timestamp: 'MM:SS', title: 'Título do Capítulo'}."
      }
      
      if (aiConfig.description) {
        prompts.description = "Crie uma descrição otimizada para YouTube baseada na transcrição. Inclua palavras-chave relevantes e seja atrativo para o público."
      }
      
      if (aiConfig.tags) {
        prompts.tags = "Gere tags relevantes para o vídeo baseado na transcrição. Retorne como lista separada por vírgulas."
      }
      
      if (aiConfig.category) {
        prompts.category = "Analise o conteúdo da transcrição e sugira a categoria mais apropriada para este vídeo."
      }

      const settings = {
        model: aiConfig.model,
        temperature: aiConfig.temperature,
        maxTokens: aiConfig.maxTokens
      }

      await processWithAI(video.id, transcriptionText, prompts, settings)
      
      // Recarregar dados do vídeo após processamento
      // Em um cenário real, você faria uma nova busca do vídeo atualizado
      
    } catch (error) {
      console.error('Erro no processamento IA:', error)
    }
  }

  const canProcessAI = transcriptionText.length > 0 && Object.values(aiConfig).slice(0, 5).some(Boolean)

  if (!video) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Editar Vídeo
          </DialogTitle>
          <DialogDescription>
            Gerencie as configurações e conteúdo do vídeo
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="transcription">Transcrição</TabsTrigger>
            <TabsTrigger value="ai-content">Conteúdo IA</TabsTrigger>
            <TabsTrigger value="compiler">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Compilação
              </div>
            </TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={video.title} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  {getStatusBadge(video.configuration_status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={handleCategoryChange}
                    disabled={savingCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={savingCategory ? "Salvando..." : "Selecionar categoria"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="update_status">Status de Atualização</Label>
                  <Select
                    value={formData.update_status}
                    onValueChange={handleUpdateStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE_FOR_UPDATE">Ativo para Atualização</SelectItem>
                      <SelectItem value="DO_NOT_UPDATE">Não Atualizar</SelectItem>
                      <SelectItem value="IGNORED">Ignorado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição Original (YouTube)</Label>
                <Textarea
                  value={video.original_description || "Nenhuma descrição disponível"}
                  readOnly
                  className="bg-muted min-h-[200px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <a
                  href={video.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Ver no YouTube
                </a>
              </div>
            </TabsContent>

            <TabsContent value="transcription" className="space-y-6">
              <TranscriptionUpload
                value={transcriptionText}
                onChange={setTranscriptionText}
                onFileUpload={uploadTranscription}
                processing={processing}
                progress={progress}
              />

              {transcriptionText && (
                <AIProcessingSettings
                  config={aiConfig}
                  onChange={setAiConfig}
                  onProcess={handleAIProcessing}
                  canProcess={canProcessAI}
                  processing={processing}
                />
              )}

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">
                    Status: {video.transcription ? "Transcrição disponível" : "Sem transcrição"}
                  </span>
                </div>
                {video.transcription && !video.ai_processed && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAIProcessing}
                    disabled={processing || !canProcessAI}
                  >
                    {processing ? 'Processando...' : 'Processar com IA'}
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ai-content" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Resumo Gerado por IA</Label>
                  <Textarea
                    value={video.ai_summary || "Nenhum resumo gerado ainda"}
                    readOnly
                    className="bg-muted min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição Gerada por IA</Label>
                  <Textarea
                    value={video.ai_description || "Nenhuma descrição gerada ainda"}
                    readOnly
                    className="bg-muted min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags Geradas por IA</Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg min-h-[60px]">
                    {video.ai_generated_tags && video.ai_generated_tags.length > 0 ? (
                      video.ai_generated_tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Nenhuma tag gerada ainda</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Capítulos Gerados</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    {video.ai_chapters && video.ai_chapters.length > 0 ? (
                      <div className="space-y-1">
                        {video.ai_chapters.map((chapter: any, index: number) => (
                          <div key={index} className="text-sm">
                            <span className="font-mono">{chapter.timestamp}</span> - {chapter.title}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Nenhum capítulo gerado ainda</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      Status IA: {video.ai_processed ? "Processado" : "Não processado"}
                    </span>
                  </div>
                  {!video.ai_processed && video.has_transcription && (
                    <Button type="button" variant="outline" size="sm">
                      Processar com IA
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="compiler" className="space-y-4">
              <DescriptionCompiler 
                video={video} 
                onUpdate={() => {
                  // Callback para atualizar dados após aplicação
                  console.log('Descrição aplicada, atualizando interface...')
                }} 
              />
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição Compilada (Final)</Label>
                <Textarea
                  value={video.compiled_description || "Descrição não compilada ainda"}
                  readOnly
                  className="bg-muted min-h-[200px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Antes (YouTube)</Label>
                  <Textarea
                    value={video.original_description || "Sem descrição original"}
                    readOnly
                    className="bg-red-50 min-h-[150px] text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Depois (Compilado)</Label>
                  <Textarea
                    value={video.compiled_description || "Não compilado"}
                    readOnly
                    className="bg-green-50 min-h-[150px] text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Compilar Preview
                </Button>
                <Button type="button" variant="outline">
                  Sincronizar com YouTube
                </Button>
              </div>
            </TabsContent>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
