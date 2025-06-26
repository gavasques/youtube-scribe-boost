
import { Play } from "lucide-react"

interface VideoThumbnailProps {
  thumbnailUrl: string | null
  title: string
}

export function VideoThumbnail({ thumbnailUrl, title }: VideoThumbnailProps) {
  return (
    <div className="w-16 h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
      {thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <Play className="w-6 h-6 text-muted-foreground" />
      )}
    </div>
  )
}
