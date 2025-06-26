import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useVideoModal } from "./VideoModalProvider"
import { FileText, Upload, Wand2 } from "lucide-react"
import { useState } from "react"

export function VideoTranscription() {
  const { video, setVideo, setIsDirty } = useVideoModal()
  const [uploading, setUploading] = useState(false)

  if (!video) return null

  const handleTranscriptionChange = (value: string) => {
    setVideo({ ...video, transcription: value })
    setIsDirty(true)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const text = await file.text()
      handleTranscriptionChange(text)
    } catch (error) {
      console.error('Erro ao ler arquivo:', error)
    } finally {
      setUploading(false)
    }
  }

  const hasTranscription = video.transcription && video.transcription.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Transcrição
          {hasTranscription && (
            <Badge variant="default" className="ml-auto bg-green-100 text-green-800 border-green-200">
              Disponível
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Texto completo do vídeo para processamento por IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('transcription-file')?.click()}
            disabled={uploading}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Carregando...' : 'Upload .txt'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled
            className="gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Auto-gerar (em breve)
          </Button>

          <input
            id="transcription-file"
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          <Textarea
            value={video.transcription || ''}
            onChange={(e) => handleTranscriptionChange(e.target.value)}
            placeholder="Cole ou digite a transcrição do vídeo aqui..."
            rows={8}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{video.transcription?.length || 0} caracteres</span>
            {hasTranscription && (
              <span className="text-green-600">✓ Pronto para IA</span>
            )}
          </div>
        </div>

        {!hasTranscription && (
          <div className="bg-muted/50 p-4 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground text-center">
              Adicione uma transcrição para gerar conteúdo com IA
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
