
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VideoThumbnail } from "./VideoThumbnail"
import { VideoInfo } from "./VideoInfo"
import { VideoDataIndicators } from "./VideoDataIndicators"
import { VideoStatusBadges } from "./VideoStatusBadges"
import { VideoUpdateStatus } from "./VideoUpdateStatus"
import { VideoActions } from "./VideoActions"
import { Video } from "@/types/video"

interface VideoTableProps {
  videos: Video[]
  onEditVideo: (video: Video) => void
  onPreviewVideo: (video: Video) => void
  onUpdateStatusToggle: (videoId: string, newStatus: string) => void
  onIgnoreVideo: (video: Video) => void
  onUnignoreVideo: (video: Video) => void
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
                <VideoThumbnail video={video} />
              </TableCell>
              <TableCell>
                <VideoInfo video={video} />
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {video.category_name || 'Sem categoria'}
                </span>
              </TableCell>
              <TableCell>
                <VideoDataIndicators video={video} />
              </TableCell>
              <VideoStatusBadges 
                configurationStatus={video.configuration_status}
                videoType={video.video_type}
              />
              <TableCell>
                <VideoUpdateStatus
                  status={video.update_status}
                  onStatusChange={(newStatus) => onUpdateStatusToggle(video.id, newStatus)}
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
