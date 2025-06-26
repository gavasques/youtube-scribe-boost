
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Video } from "@/types/video"
import { VideoThumbnail } from "./VideoThumbnail"
import { VideoInfo } from "./VideoInfo"
import { VideoStatusBadges } from "./VideoStatusBadges"
import { VideoUpdateStatus } from "./VideoUpdateStatus"
import { VideoDataIndicators } from "./VideoDataIndicators"
import { VideoActions } from "./VideoActions"

interface VideoTableProps {
  videos: Video[]
  onEditVideo: (video: Video) => void
  onPreviewVideo: (video: Video) => void
  onUpdateStatusToggle: (videoId: string, newStatus: string) => void
}

export function VideoTable({ videos, onEditVideo, onPreviewVideo, onUpdateStatusToggle }: VideoTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vídeo</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Status Config.</TableHead>
          <TableHead>Status Atualização</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Dados</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {videos.map((video) => (
          <TableRow key={video.id}>
            <TableCell>
              <div className="flex items-start gap-3">
                <VideoThumbnail
                  thumbnailUrl={video.thumbnail_url}
                  title={video.title}
                />
                <VideoInfo
                  title={video.title}
                  viewsCount={video.views_count}
                  publishedAt={video.published_at}
                  durationFormatted={video.duration_formatted}
                  likesCount={video.likes_count}
                />
              </div>
            </TableCell>
            <TableCell>
              {video.category_name ? (
                <Badge variant="outline">
                  {video.category_name}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">Sem categoria</span>
              )}
            </TableCell>
            <VideoStatusBadges
              configurationStatus={video.configuration_status}
              videoType={video.video_type}
            />
            <TableCell>
              <VideoUpdateStatus
                updateStatus={video.update_status}
                onToggle={(checked) => 
                  onUpdateStatusToggle(
                    video.id, 
                    checked ? "ACTIVE_FOR_UPDATE" : "DO_NOT_UPDATE"
                  )
                }
              />
            </TableCell>
            <TableCell>
              <VideoDataIndicators
                hasTranscription={video.has_transcription}
                aiProcessed={video.ai_processed}
                youtubeUrl={video.youtube_url}
              />
            </TableCell>
            <TableCell>
              <VideoActions
                video={video}
                onEdit={onEditVideo}
                onPreview={onPreviewVideo}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
