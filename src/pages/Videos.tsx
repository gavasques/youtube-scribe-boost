import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, RefreshCw, Eye, Edit, Play, FileText, Brain, ExternalLink, Youtube } from "lucide-react"
import { VideoModal } from "@/components/Videos/VideoModal"
import { VideoFilters } from "@/components/Videos/VideoFilters"
import { YouTubeSyncModal } from "@/components/Videos/YouTubeSyncModal"
import { Video, VideoFilters as VideoFiltersType, VideoFormData } from "@/types/video"
import { Category } from "@/types/category"
import { useToast } from "@/hooks/use-toast"
import { VideoPreviewModal } from "@/components/Videos/VideoPreviewModal"
import { useVideos } from "@/hooks/useVideos"
import { useAuditLog } from "@/hooks/useAuditLog"

export default function Videos() {
  const { toast } = useToast()
  const { videos, loading, fetchVideos } = useVideos()
  const { logEvent } = useAuditLog()
  const [showModal, setShowModal] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [previewingVideo, setPreviewingVideo] = useState<Video | null>(null)
  
  const [filters, setFilters] = useState<VideoFiltersType>({
    search: "",
    configuration_status: "all",
    update_status: "all",
    category_id: "all",
    video_type: "all"
  })

  // Mock categories
  const categories: Category[] = [
    {
      id: "1",
      user_id: "mock-user-id",
      name: "Importação",
      description: "Vídeos sobre importação de produtos",
      parent_id: null,
      color: "#f97316",
      icon: "package",
      is_active: true,
      created_at: "2024-06-15",
      updated_at: "2024-06-15",
      video_count: 12,
      children: []
    },
    {
      id: "2",
      user_id: "mock-user-id",
      name: "Internacionalização",
      description: "Expansão internacional de negócios",
      parent_id: null,
      color: "#22c55e",
      icon: "globe",
      is_active: true,
      created_at: "2024-06-10",
      updated_at: "2024-06-10",
      video_count: 8,
      children: []
    },
    {
      id: "3",
      user_id: "mock-user-id",
      name: "Amazon",
      description: "Vendas na plataforma Amazon",
      parent_id: null,
      color: "#3b82f6",
      icon: "shopping-cart",
      is_active: true,
      created_at: "2024-06-05",
      updated_at: "2024-06-05",
      video_count: 15,
      children: []
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIGURED":
        return <Badge variant="default" className="bg-green-100 text-green-800">Configurado</Badge>
      case "NEEDS_ATTENTION":
        return <Badge variant="destructive">Requer Atenção</Badge>
      default:
        return <Badge variant="secondary">Não Configurado</Badge>
    }
  }

  const getUpdateStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE_FOR_UPDATE":
        return "Ativo"
      case "DO_NOT_UPDATE":
        return "Não Atualizar"
      case "IGNORED":
        return "Ignorado"
      default:
        return status
    }
  }

  const handleUpdateStatusToggle = async (videoId: string, newStatus: string) => {
    try {
      // Log the status change
      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Video status changed to: ${getUpdateStatusLabel(newStatus)}`,
        metadata: {
          video_id: videoId,
          old_status: videos.find(v => v.id === videoId)?.update_status,
          new_status: newStatus
        },
        severity: 'LOW'
      })

      // Implementar atualização real do status
      toast({
        title: "Status atualizado!",
        description: `Status de atualização alterado para: ${getUpdateStatusLabel(newStatus)}`,
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
    
    setEditingVideo(video)
    setShowModal(true)
  }

  const handleSaveVideo = async (data: VideoFormData) => {
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
      
      setEditingVideo(null)
      setShowModal(false)
    } catch (error) {
      await logEvent({
        event_type: 'VIDEO_UPDATE',
        description: `Failed to update video: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { video_id: editingVideo.id, error: String(error) },
        severity: 'HIGH'
      })
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingVideo(null)
  }

  const handlePreviewVideo = (video: Video) => {
    setPreviewingVideo(video)
    setShowPreviewModal(true)
  }

  const handleClosePreviewModal = () => {
    setShowPreviewModal(false)
    setPreviewingVideo(null)
  }

  const handleSyncComplete = async () => {
    await logEvent({
      event_type: 'SYNC_OPERATION',
      description: 'YouTube synchronization completed successfully',
      metadata: { operation: 'sync_complete', videos_count: videos.length },
      severity: 'LOW'
    })
    
    fetchVideos()
    setShowSyncModal(false)
  }

  // Filter videos based on current filters
  const getFilteredVideos = () => {
    return videos.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(filters.search.toLowerCase())
      const matchesConfigStatus = filters.configuration_status === "all" || video.configuration_status === filters.configuration_status
      const matchesUpdateStatus = filters.update_status === "all" || video.update_status === filters.update_status
      const matchesCategory = filters.category_id === "all" || 
        (filters.category_id === "uncategorized" && !video.category_id) ||
        video.category_id === filters.category_id
      const matchesType = filters.video_type === "all" || video.video_type === filters.video_type

      return matchesSearch && matchesConfigStatus && matchesUpdateStatus && matchesCategory && matchesType
    })
  }

  const filteredVideos = getFilteredVideos()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vídeos</h1>
          <p className="text-muted-foreground">
            Gerencie seus vídeos do YouTube e suas descrições
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowSyncModal(true)}
          >
            <Youtube className="w-4 h-4" />
            Sincronizar com YouTube
          </Button>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Transcrição
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros para encontrar vídeos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VideoFilters
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
          />
        </CardContent>
      </Card>

      {/* Videos Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vídeos ({filteredVideos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando vídeos...</p>
            </div>
          ) : (
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
                {filteredVideos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                          <Play className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-2 text-sm">
                            {video.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{video.views || '0'} views</span>
                            <span>•</span>
                            <span>{video.published_at}</span>
                            {video.duration && (
                              <>
                                <span>•</span>
                                <span>{video.duration}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {video.category_name ? (
                        <Badge variant="outline" style={{ 
                          backgroundColor: categories.find(c => c.id === video.category_id)?.color + '20',
                          borderColor: categories.find(c => c.id === video.category_id)?.color,
                          color: categories.find(c => c.id === video.category_id)?.color
                        }}>
                          {video.category_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem categoria</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(video.configuration_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={video.update_status === "ACTIVE_FOR_UPDATE"}
                          onCheckedChange={(checked) => 
                            handleUpdateStatusToggle(
                              video.id, 
                              checked ? "ACTIVE_FOR_UPDATE" : "DO_NOT_UPDATE"
                            )
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {getUpdateStatusLabel(video.update_status)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={video.video_type === "SHORT" ? "secondary" : "outline"}>
                        {video.video_type === "SHORT" ? "Short" : "Regular"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {video.has_transcription && (
                          <span title="Tem transcrição">
                            <FileText className="w-4 h-4 text-green-600" />
                          </span>
                        )}
                        {video.ai_processed && (
                          <span title="Processado por IA">
                            <Brain className="w-4 h-4 text-blue-600" />
                          </span>
                        )}
                        <span 
                          title="Ver no YouTube"
                          className="cursor-pointer"
                          onClick={() => window.open(video.youtube_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-blue-600" />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 h-8"
                          onClick={() => handleEditVideo(video)}
                        >
                          <Edit className="w-3 h-3" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 h-8"
                          onClick={() => handlePreviewVideo(video)}
                        >
                          <Eye className="w-3 h-3" />
                          Preview
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredVideos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum vídeo encontrado com os filtros aplicados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Modal */}
      <VideoModal
        open={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveVideo}
        video={editingVideo}
        categories={categories}
      />

      {/* Sync Modal */}
      <YouTubeSyncModal
        open={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSyncComplete={handleSyncComplete}
      />

      {/* Video Preview Modal */}
      <VideoPreviewModal
        open={showPreviewModal}
        onClose={handleClosePreviewModal}
        video={previewingVideo}
      />
    </div>
  )
}
