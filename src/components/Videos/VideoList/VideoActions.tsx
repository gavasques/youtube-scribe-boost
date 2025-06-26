
import { Button } from "@/components/ui/button"
import { Edit, Eye, EyeOff } from "lucide-react"
import { Video } from "@/types/video"

interface VideoActionsProps {
  video: Video
  onEdit: (video: Video) => void
  onPreview: (video: Video) => void
  onIgnore: (video: Video) => void
  onUnignore: (video: Video) => void
}

export function VideoActions({ video, onEdit, onPreview, onIgnore, onUnignore }: VideoActionsProps) {
  const isIgnored = video.update_status === 'IGNORED'

  return (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="sm"
        className="gap-1 h-8"
        onClick={() => onEdit(video)}
      >
        <Edit className="w-3 h-3" />
        Editar
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1 h-8"
        onClick={() => onPreview(video)}
      >
        <Eye className="w-3 h-3" />
        Preview
      </Button>
      {isIgnored ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1 h-8 text-green-600 hover:text-green-700"
          onClick={() => onUnignore(video)}
        >
          <Eye className="w-3 h-3" />
          Designorar
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1 h-8 text-red-600 hover:text-red-700"
          onClick={() => onIgnore(video)}
        >
          <EyeOff className="w-3 h-3" />
          Ignorar
        </Button>
      )}
    </div>
  )
}
