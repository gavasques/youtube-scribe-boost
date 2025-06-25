
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
import { Upload, Play, FileText, Brain, Eye, ExternalLink } from "lucide-react"
import { Video, VideoFormData } from "@/types/video"
import { Category } from "@/types/category"

interface VideoModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: VideoFormData) => void
  video?: Video | null
  categories: Category[]
}

export function VideoModal({ open, onClose, onSave, video, categories }: VideoModalProps) {
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

  if (!video) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="transcription">Transcrição</TabsTrigger>
            <TabsTrigger value="ai-content">Conteúdo IA</TabsTrigger>
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, update_status: value as any }))}
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
                  className="bg-muted min-h-[100px]"
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

            <TabsContent value="transcription" className="space-y-4">
              <div className="space-y-2">
                <Label>Upload de Transcrição</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Arraste um arquivo de transcrição ou clique para selecionar
                  </p>
                  <Button type="button" variant="outline" size="sm">
                    Selecionar Arquivo
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transcription">Transcrição Manual</Label>
                <Textarea
                  id="transcription"
                  value={transcriptionText}
                  onChange={(e) => setTranscriptionText(e.target.value)}
                  placeholder="Cole ou digite a transcrição do vídeo aqui..."
                  className="min-h-[200px]"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">
                    Status: {video.transcription ? "Transcrição disponível" : "Sem transcrição"}
                  </span>
                </div>
                {video.transcription && (
                  <Button type="button" variant="outline" size="sm">
                    Processar com IA
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
