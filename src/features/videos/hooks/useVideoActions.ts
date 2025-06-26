
import { useToast } from "@/hooks/use-toast"
import { useAuditLog } from "@/hooks/useAuditLog"
import { VideoConfigurationService } from "../services/VideoConfigurationService"
import { VideoService } from "../services/VideoService"
import { VideoWithRelations } from "../types/normalized"
import { VideoFormData } from "../types"
import { UPDATE_STATUS_LABELS } from "@/utils/videoConstants"

export function useVideoActions() {
  const { toast } = useToast()
  const { logEvent } = useAuditLog()

  const handleUpdateStatusToggle = async (videoId: string, newStatus: string, videos: VideoWithRelations[]) => {
    try {
      await VideoConfigurationService.updateStatus(videoId, undefined, newStatus)

      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Video status changed to: ${UPDATE_STATUS_LABELS[newStatus as keyof typeof UPDATE_STATUS_LABELS]}`,
        metadata: {
          video_id: videoId,
          old_status: videos.find(v => v.id === videoId)?.configuration?.update_status,
          new_status: newStatus
        },
        severity: 'LOW'
      })

      toast({
        title: "Status atualizado!",
        description: `Status de atualização alterado para: ${UPDATE_STATUS_LABELS[newStatus as keyof typeof UPDATE_STATUS_LABELS]}`,
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      
      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Failed to update video status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { video_id: videoId, error: String(error) },
        severity: 'MEDIUM'
      })

      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status do vídeo",
        variant: "destructive"
      })
    }
  }

  const handleIgnoreVideo = async (video: VideoWithRelations) => {
    try {
      await VideoConfigurationService.updateStatus(video.id, undefined, 'IGNORED')

      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Video ignored: ${video.title}`,
        metadata: { video_id: video.id, action: 'ignore' },
        severity: 'LOW'
      })

      toast({
        title: "Vídeo ignorado!",
        description: `O vídeo "${video.title}" foi ignorado e não aparecerá mais na lista.`,
      })
    } catch (error) {
      console.error('Erro ao ignorar vídeo:', error)
      
      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Failed to ignore video: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { video_id: video.id, error: String(error) },
        severity: 'MEDIUM'
      })

      toast({
        title: "Erro ao ignorar",
        description: "Não foi possível ignorar o vídeo",
        variant: "destructive"
      })
    }
  }

  const handleUnignoreVideo = async (video: VideoWithRelations) => {
    try {
      await VideoConfigurationService.updateStatus(video.id, undefined, 'ACTIVE_FOR_UPDATE')

      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Video unignored: ${video.title}`,
        metadata: { video_id: video.id, action: 'unignore' },
        severity: 'LOW'
      })

      toast({
        title: "Vídeo designorado!",
        description: `O vídeo "${video.title}" voltou a aparecer na lista.`,
      })
    } catch (error) {
      console.error('Erro ao designorar vídeo:', error)
      
      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Failed to unignore video: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { video_id: video.id, error: String(error) },
        severity: 'MEDIUM'
      })

      toast({
        title: "Erro ao designorar",
        description: "Não foi possível designorar o vídeo",
        variant: "destructive"
      })
    }
  }

  const handleEditVideo = async (video: VideoWithRelations) => {
    await logEvent({
      event_type: 'VIDEO_UPDATE',
      description: `Started editing video: ${video.title}`,
      metadata: { video_id: video.id, action: 'edit_start' },
      severity: 'LOW'
    })
  }

  const handleSaveVideo = async (editingVideo: VideoWithRelations | null, data: VideoFormData) => {
    if (!editingVideo) return

    try {
      // Update core video data
      await VideoService.updateVideo(editingVideo.id, {
        category_id: data.category_id || undefined
      })

      // Update configuration if needed
      if (data.update_status) {
        await VideoConfigurationService.updateStatus(editingVideo.id, undefined, data.update_status)
      }

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
      console.error('Erro ao salvar vídeo:', error)

      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Failed to update video: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { video_id: editingVideo.id, error: String(error) },
        severity: 'HIGH'
      })

      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive"
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
    handleIgnoreVideo,
    handleUnignoreVideo,
    handleEditVideo,
    handleSaveVideo,
    handleSyncComplete
  }
}
