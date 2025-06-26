
import { useState } from 'react'
import { useToast } from "@/hooks/use-toast"
import { useAuditLog } from "@/hooks/useAuditLog"
import { VideoService } from "@/features/videos/services/VideoService"
import { categoryService } from "@/services/categoryService"
import { VideoWithRelations } from "@/features/videos/types/normalized"

export function useMassVideoUpdate() {
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()
  const { logEvent } = useAuditLog()

  const updateAllVideosToCategory = async (categoryName: string, videos: VideoWithRelations[]) => {
    setUpdating(true)
    
    try {
      // Primeiro, buscar ou criar a categoria
      const categories = await categoryService.fetchCategories()
      let targetCategory = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase())
      
      if (!targetCategory) {
        // Criar a categoria se ela não existir
        targetCategory = await categoryService.createCategory({
          name: categoryName,
          description: `Categoria criada automaticamente para ${categoryName}`,
          is_active: true
        })
        
        toast({
          title: "Categoria criada",
          description: `A categoria "${categoryName}" foi criada automaticamente.`,
        })
      }

      // Atualizar todos os vídeos para essa categoria
      const updatePromises = videos.map(async (video) => {
        try {
          await VideoService.updateVideo(video.id, {
            category_id: targetCategory!.id
          })
          return { success: true, videoId: video.id, title: video.title }
        } catch (error) {
          console.error(`Erro ao atualizar vídeo ${video.title}:`, error)
          return { success: false, videoId: video.id, title: video.title, error }
        }
      })

      const results = await Promise.all(updatePromises)
      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      // Log da operação
      await logEvent({
        event_type: 'VIDEO_BULK_UPDATE',
        description: `Atualização em massa: ${successful.length} vídeos movidos para categoria "${categoryName}"`,
        metadata: {
          category_name: categoryName,
          category_id: targetCategory.id,
          total_videos: videos.length,
          successful_updates: successful.length,
          failed_updates: failed.length,
          operation: 'category_assignment'
        },
        severity: failed.length > 0 ? 'MEDIUM' : 'LOW'
      })

      if (successful.length > 0) {
        toast({
          title: "Atualização concluída!",
          description: `${successful.length} vídeos foram movidos para a categoria "${categoryName}".${failed.length > 0 ? ` ${failed.length} falharam.` : ''}`,
        })
      }

      if (failed.length > 0) {
        toast({
          title: "Alguns vídeos falharam",
          description: `${failed.length} vídeos não puderam ser atualizados. Verifique os logs para detalhes.`,
          variant: "destructive"
        })
      }

      return { successful, failed, category: targetCategory }
    } catch (error) {
      console.error('Erro na atualização em massa:', error)
      
      await logEvent({
        event_type: 'VIDEO_BULK_UPDATE',
        description: `Falha na atualização em massa para categoria "${categoryName}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        metadata: { category_name: categoryName, error: String(error) },
        severity: 'HIGH'
      })

      toast({
        title: "Erro na atualização",
        description: "Não foi possível atualizar os vídeos. Tente novamente.",
        variant: "destructive"
      })
      
      throw error
    } finally {
      setUpdating(false)
    }
  }

  return {
    updateAllVideosToCategory,
    updating
  }
}
