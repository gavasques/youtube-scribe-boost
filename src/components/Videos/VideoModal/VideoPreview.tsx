
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useVideoModal } from "./VideoModalProvider"
import { Eye, ExternalLink, Copy } from "lucide-react"
import { useState } from "react"

export function VideoPreview() {
  const { video } = useVideoModal()
  const [copied, setCopied] = useState(false)

  if (!video) return null

  const finalDescription = video.compiled_description || video.current_description || ''

  const handleCopy = async () => {
    if (finalDescription) {
      await navigator.clipboard.writeText(finalDescription)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openYouTube = () => {
    if (video.youtube_url) {
      window.open(video.youtube_url, '_blank')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Preview Final
          <Badge variant="outline" className="ml-auto">
            {finalDescription.length} caracteres
          </Badge>
        </CardTitle>
        <CardDescription>
          Visualização da descrição final que será aplicada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
            disabled={!finalDescription}
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={openYouTube}
            className="gap-2"
            disabled={!video.youtube_url}
          >
            <ExternalLink className="w-4 h-4" />
            Ver no YouTube
          </Button>
        </div>

        <div className="space-y-2">
          <div className="bg-muted/50 p-4 rounded-lg border max-h-[400px] overflow-y-auto">
            <h4 className="font-medium mb-2">📺 {video.title}</h4>
            <div className="whitespace-pre-wrap text-sm">
              {finalDescription || (
                <span className="text-muted-foreground italic">
                  Nenhuma descrição compilada disponível
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Esta é a descrição final que será enviada para o YouTube</p>
          <p>• Verifique se todos os links e informações estão corretos</p>
          <p>• Lembre-se de que mudanças no YouTube podem levar alguns minutos para aparecer</p>
        </div>
      </CardContent>
    </Card>
  )
}
