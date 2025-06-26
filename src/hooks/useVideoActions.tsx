
import { useToast } from "@/hooks/use-toast"
import { useAuditLog } from "@/hooks/useAuditLog"
import { Video, VideoFormData } from "@/types/video"
import { UPDATE_STATUS_LABELS } from "@/utils/videoConstants"

export function useVideoActions() {
  const { toast } = useToast()
  const { logEvent } = useAuditLog()

  const handleUpdateStatusToggle = async (videoId: string, newStatus: string, videos: Video[]) => {
    try {
      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Video status changed to: ${UPDATE_STATUS_LABELS[newStatus as keyof typeof UPDATE_STATUS_LABELS]}`,
        metadata: {
          video_id: videoId,
          old_status: videos.find(v => v.id === videoId)?.update_status,
          new_status: newStatus
        },
        severity: 'LOW'
      })

      toast({
        title: "Status atualizado!",
        description: `Status de atualização alterado para: ${UPDATE_STATUS_LABELS[newStatus as keyof typeof UPDATE_STATUS_LABELS]}`,
      })
    } catch (error) {
      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Failed to update video status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { video_id: videoId, error: String(error) },
        severity: 'MEDIUM'
      })
    }
  }

  const handleEditVideo = async (video: Video) => {
    await logEvent({
      event_type: 'VIDEO_UPDATE',
      description: `Started editing video: ${video.title}`,
      metadata: { video_id: video.id, action: 'edit_start' },
      severity: 'LOW'
    })
  }

  const handleSaveVideo = async (editingVideo: Video | null, data: VideoFormData) => {
    if (!editingVideo) return

    try {
      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Video updated successfully: ${editingVideo.title}`,
        metadata: { 
          video_id: editingVideo.id, 
          updated_fields: Object.keys(data),
          action: 'edit_complete'
        },
        severity: 'LOW'
      })

      toast({
        title: "Vídeo atualizado!",
        description: "As alterações foram salvas com sucesso.",
      })
    } catch (error) {
      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Failed to update video: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { video_id: editingVideo.id, error: String(error) },
        severity: 'HIGH'
      })
    }
  }

  const handleSyncComplete = async (videosCount: number) => {
    await logEvent({
      event_type: 'SYNC_OPERATION',
      description: 'YouTube synchronization completed successfully',
      metadata: { operation: 'sync_complete', videos_count: videosCount },
      severity: 'LOW'
    })
  }

  return {
    handleUpdateStatusToggle,
    handleEditVideo,
    handleSaveVideo,
    handleSyncComplete
  }
}
