
import { RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoTable } from "./VideoTable"
import { Video } from "@/types/video"

interface VideoListProps {
  videos: Video[]
  loading: boolean
  onEditVideo: (video: Video) => void
  onPreviewVideo: (video: Video) => void
  onUpdateStatusToggle: (videoId: string, newStatus: string) => void
}

export function VideoList({ 
  videos, 
  loading, 
  onEditVideo, 
  onPreviewVideo, 
  onUpdateStatusToggle 
}: VideoListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vídeos (carregando...)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando vídeos...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vídeos ({videos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum vídeo encontrado com os filtros aplicados.</p>
          </div>
        ) : (
          <VideoTable
            videos={videos}
            onEditVideo={onEditVideo}
            onPreviewVideo={onPreviewVideo}
            onUpdateStatusToggle={onUpdateStatusToggle}
          />
        )}
      </CardContent>
    </Card>
  )
}
