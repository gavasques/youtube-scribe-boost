
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VideoThumbnail } from "./VideoThumbnail"
import { VideoInfo } from "./VideoInfo"
import { VideoDataIndicators } from "./VideoDataIndicators"
import { VideoStatusBadges } from "./VideoStatusBadges"
import { VideoUpdateStatus } from "./VideoUpdateStatus"
import { VideoActions } from "./VideoActions"
import { VideoWithRelations } from "@/features/videos/types/normalized"

interface VideoTableProps {
  videos: VideoWithRelations[]
  onEditVideo: (video: VideoWithRelations) => void
  onPreviewVideo: (video: VideoWithRelations) => void
  onUpdateStatusToggle: (videoId: string, newStatus: string) => void
  onIgnoreVideo: (video: VideoWithRelations) => void
  onUnignoreVideo: (video: VideoWithRelations) => void
}

export function VideoTable({ 
  videos, 
  onEditVideo, 
  onPreviewVideo, 
  onUpdateStatusToggle,
  onIgnoreVideo,
  onUnignoreVideo
}: VideoTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Thumb</TableHead>
            <TableHead>Vídeo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Dados</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Atualização</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <TableRow 
              key={video.id}
              className={video.update_status === 'IGNORED' ? 'opacity-50 bg-gray-50' : ''}
            >
              <TableCell>
                <VideoThumbnail 
                  thumbnailUrl={video.thumbnail_url} 
                  title={video.title}
                />
              </TableCell>
              <TableCell>
                <VideoInfo 
                  title={video.title}
                  viewsCount={video.views_count}
                  publishedAt={video.published_at}
                  durationFormatted={video.duration_formatted}
                  likesCount={video.likes_count}
                />
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {video.category_name || 'Sem categoria'}
                </span>
              </TableCell>
              <TableCell>
                <VideoDataIndicators 
                  hasTranscription={!!video.transcription}
                  aiProcessed={!!video.ai_summary}
                  youtubeUrl={video.youtube_url}
                />
              </TableCell>
              <VideoStatusBadges 
                configurationStatus={video.configuration_status}
                videoType={video.video_type}
              />
              <TableCell>
                <VideoUpdateStatus
                  updateStatus={video.update_status}
                  onToggle={(checked) => onUpdateStatusToggle(video.id, checked ? 'ACTIVE_FOR_UPDATE' : 'DO_NOT_UPDATE')}
                />
              </TableCell>
              <TableCell className="text-right">
                <VideoActions
                  video={video}
                  onEdit={onEditVideo}
                  onPreview={onPreviewVideo}
                  onIgnore={onIgnoreVideo}
                  onUnignore={onUnignoreVideo}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
