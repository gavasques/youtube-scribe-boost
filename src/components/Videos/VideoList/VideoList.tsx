
import { RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoTable } from "./VideoTable"
import { VideoWithRelations } from "@/features/videos/types/normalized"

interface VideoListProps {
  videos: VideoWithRelations[]
  loading: boolean
  onEditVideo: (video: VideoWithRelations) => void
  onPreviewVideo: (video: VideoWithRelations) => void
  onUpdateStatusToggle: (videoId: string, newStatus: string) => void
  onIgnoreVideo: (video: VideoWithRelations) => void
  onUnignoreVideo: (video: VideoWithRelations) => void
}

export function VideoList({ 
  videos, 
  loading, 
  onEditVideo, 
  onPreviewVideo, 
  onUpdateStatusToggle,
  onIgnoreVideo,
  onUnignoreVideo
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
            onIgnoreVideo={onIgnoreVideo}
            onUnignoreVideo={onUnignoreVideo}
          />
        )}
      </CardContent>
    </Card>
  )
}
