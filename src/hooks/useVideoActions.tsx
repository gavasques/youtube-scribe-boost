
import { useToast } from "@/hooks/use-toast"
import { useAuditLog } from "@/hooks/useAuditLog"
import { supabase } from "@/integrations/supabase/client"
import { Video, VideoFormData } from "@/types/video"
import { UPDATE_STATUS_LABELS } from "@/utils/videoConstants"

export function useVideoActions() {
  const { toast } = useToast()
  const { logEvent } = useAuditLog()

  const handleUpdateStatusToggle = async (videoId: string, newStatus: string, videos: Video[]) => {
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('videos')
        .update({ update_status: newStatus })
        .eq('id', videoId)

      if (error) throw error

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
      // Preparar dados para atualização
      const updateData: any = {
        category_id: data.category_id || null,
        update_status: data.update_status,
        transcription: data.transcription || null,
        updated_at: new Date().toISOString()
      }

      // Atualizar no banco de dados
      const { error } = await supabase
        .from('videos')
        .update(updateData)
        .eq('id', editingVideo.id)

      if (error) throw error

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
    handleEditVideo,
    handleSaveVideo,
    handleSyncComplete
  }
}
