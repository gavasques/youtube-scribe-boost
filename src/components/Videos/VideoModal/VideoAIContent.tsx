
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useVideoModal } from "./VideoModalProvider"
import { Brain, RefreshCw, Sparkles } from "lucide-react"
import { useState } from "react"

export function VideoAIContent() {
  const { video, setVideo, setIsDirty } = useVideoModal()
  const [processing, setProcessing] = useState(false)

  if (!video) return null

  const handleSummaryChange = (value: string) => {
    setVideo({ ...video, ai_summary: value })
    setIsDirty(true)
  }

  const handleDescriptionChange = (value: string) => {
    setVideo({ ...video, ai_description: value })
    setIsDirty(true)
  }

  const handleGenerateAI = async () => {
    if (!video.transcription) return

    setProcessing(true)
    try {
      // Simular processamento IA
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Em produção, chamar API de IA aqui
      handleSummaryChange("Resumo gerado automaticamente...")
      handleDescriptionChange("Descrição gerada automaticamente...")
    } catch (error) {
      console.error('Erro ao processar IA:', error)
    } finally {
      setProcessing(false)
    }
  }

  const hasSummary = video.ai_summary && video.ai_summary.length > 0
  const hasDescription = video.ai_description && video.ai_description.length > 0
  const canGenerate = video.transcription && video.transcription.length > 50

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Conteúdo IA
          {(hasSummary || hasDescription) && (
            <Badge variant="success" className="ml-auto">
              Processado
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Conteúdo gerado automaticamente pela inteligência artificial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateAI}
            disabled={!canGenerate || processing}
            className="gap-2"
          >
            {processing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {processing ? 'Processando...' : 'Gerar com IA'}
          </Button>
          
          {!canGenerate && (
            <p className="text-sm text-muted-foreground self-center">
              Adicione uma transcrição com pelo menos 50 caracteres
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Resumo IA</label>
            <Textarea
              value={video.ai_summary || ''}
              onChange={(e) => handleSummaryChange(e.target.value)}
              placeholder="Resumo gerado pela IA aparecerá aqui..."
              rows={4}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição IA</label>
            <Textarea
              value={video.ai_description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Descrição gerada pela IA aparecerá aqui..."
              rows={6}
              className="min-h-[150px]"
            />
          </div>
        </div>

        {processing && (
          <div className="bg-blue-50 p-4 rounded-lg border">
            <p className="text-sm text-blue-700 text-center">
              ✨ IA processando transcrição... Isso pode levar alguns segundos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
