
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Eye, ExternalLink, Copy, CheckCircle } from "lucide-react"
import { Video } from "@/types/video"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface VideoPreviewModalProps {
  open: boolean
  onClose: () => void
  video?: Video | null
}

export function VideoPreviewModal({ open, onClose, video }: VideoPreviewModalProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  if (!video) return null

  const handleCopyDescription = async () => {
    if (video.compiled_description) {
      await navigator.clipboard.writeText(video.compiled_description)
      setCopied(true)
      toast({
        title: "Descrição copiada!",
        description: "A descrição compilada foi copiada para a área de transferência.",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getCompiledDescription = () => {
    if (video.compiled_description) {
      return video.compiled_description
    }
    
    // Mock compiled description if not available
    return `🎯 NESTE VÍDEO:
${video.ai_description || video.original_description || video.title}

📱 LINKS ÚTEIS:
• Site oficial: https://exemplo.com
• Instagram: @meucanal
• E-mail: contato@exemplo.com

🏷️ TAGS:
${video.ai_generated_tags?.join(', ') || video.current_tags?.join(', ') || 'Sem tags'}

${video.ai_chapters && video.ai_chapters.length > 0 ? `
⏰ CAPÍTULOS:
${video.ai_chapters.map((chapter: any) => `${chapter.timestamp} - ${chapter.title}`).join('\n')}
` : ''}

#importação #negócios #empreendedorismo`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Preview da Descrição
          </DialogTitle>
          <DialogDescription>
            Visualize como a descrição ficará após a compilação dos blocos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Play className="w-5 h-5" />
                {video.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{video.views || '0'} views</span>
                <span>•</span>
                <span>{video.published_at}</span>
                {video.duration && (
                  <>
                    <span>•</span>
                    <span>{video.duration}</span>
                  </>
                )}
                <span>•</span>
                <Badge variant="outline">
                  {video.video_type === "SHORT" ? "Short" : "Regular"}
                </Badge>
                {video.category_name && (
                  <>
                    <span>•</span>
                    <Badge variant="outline">{video.category_name}</Badge>
                  </>
                )}
              </div>
              <div className="mt-2">
                <a
                  href={video.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver no YouTube
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Before/After Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Antes (Original)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={video.original_description || "Nenhuma descrição original disponível"}
                  readOnly
                  className="bg-red-50 border-red-200 min-h-[200px] text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Depois (Compilado)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={getCompiledDescription()}
                  readOnly
                  className="bg-green-50 border-green-200 min-h-[200px] text-sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Final Compiled Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Descrição Final Compilada
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyDescription}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Esta é a descrição que será sincronizada com o YouTube:</Label>
                <Textarea
                  value={getCompiledDescription()}
                  readOnly
                  className="bg-muted min-h-[300px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Processing Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Processamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${video.transcription ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">Transcrição</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${video.ai_processed ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">Processamento IA</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${video.compiled_description ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm">Compilação</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-sm">Sincronização</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline">
              Compilar Novamente
            </Button>
            <Button variant="outline">
              Sincronizar com YouTube
            </Button>
          </div>
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
