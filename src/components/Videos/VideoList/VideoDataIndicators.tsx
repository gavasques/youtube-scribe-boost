
import { FileText, Brain, ExternalLink } from "lucide-react"

interface VideoDataIndicatorsProps {
  hasTranscription?: boolean
  aiProcessed?: boolean
  youtubeUrl: string
}

export function VideoDataIndicators({ hasTranscription, aiProcessed, youtubeUrl }: VideoDataIndicatorsProps) {
  return (
    <div className="flex gap-1">
      {hasTranscription && (
        <span title="Tem transcrição">
          <FileText className="w-4 h-4 text-green-600" />
        </span>
      )}
      {aiProcessed && (
        <span title="Processado por IA">
          <Brain className="w-4 h-4 text-blue-600" />
        </span>
      )}
      <span 
        title="Ver no YouTube"
        className="cursor-pointer"
        onClick={() => window.open(youtubeUrl, '_blank')}
      >
        <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-blue-600" />
      </span>
    </div>
  )
}
