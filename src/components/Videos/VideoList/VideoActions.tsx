
import { Button } from "@/components/ui/button"
import { Edit, Eye } from "lucide-react"
import { Video } from "@/types/video"

interface VideoActionsProps {
  video: Video
  onEdit: (video: Video) => void
  onPreview: (video: Video) => void
}

export function VideoActions({ video, onEdit, onPreview }: VideoActionsProps) {
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
    </div>
  )
}
