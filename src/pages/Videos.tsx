
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, RefreshCw, Eye, Edit, Play, FileText, Brain, ExternalLink } from "lucide-react"
import { VideoModal } from "@/components/Videos/VideoModal"
import { VideoFilters } from "@/components/Videos/VideoFilters"
import { Video, VideoFilters as VideoFiltersType, VideoFormData } from "@/types/video"
import { Category } from "@/types/category"
import { useToast } from "@/hooks/use-toast"

export default function Videos() {
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  
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
      name: "Importação",
      description: "Vídeos sobre importação de produtos",
      parent_id: undefined,
      color: "#f97316",
      icon: "package",
      is_active: true,
      video_count: 12,
      created_at: "2024-06-15"
    },
    {
      id: "2",
      name: "Internacionalização",
      description: "Expansão internacional de negócios",
      parent_id: undefined,
      color: "#22c55e",
      icon: "globe",
      is_active: true,
      video_count: 8,
      created_at: "2024-06-10"
    },
    {
      id: "3",
      name: "Amazon",
      description: "Vendas na plataforma Amazon",
      parent_id: undefined,
      color: "#3b82f6",
      icon: "shopping-cart",
      is_active: true,
      video_count: 15,
      created_at: "2024-06-05"
    }
  ]

  // Mock videos data
  const [videos, setVideos] = useState<Video[]>([
    {
      id: "1",
      youtube_id: "abc123",
      youtube_url: "https://youtube.com/watch?v=abc123",
      title: "Como Importar Produtos da China - Guia Completo 2024",
      thumbnail_url: "https://i.ytimg.com/vi/abc123/mqdefault.jpg",
      category_id: "1",
      category_name: "Importação",
      configuration_status: "CONFIGURED",
      update_status: "ACTIVE_FOR_UPDATE",
      video_type: "REGULAR",
      published_at: "2024-06-20",
      views: "12.5K",
      duration: "15:32",
      original_description: "Neste vídeo ensino como importar produtos da China de forma segura...",
      current_description: "Neste vídeo ensino como importar produtos da China de forma segura...",
      compiled_description: "🎯 NESTE VÍDEO:\nNeste vídeo ensino como importar produtos da China...\n\n📱 LINKS ÚTEIS:\n...",
      transcription: "Olá pessoal, hoje vou ensinar como importar produtos...",
      has_transcription: true,
      ai_processed: true,
      ai_summary: "Vídeo sobre importação de produtos da China com dicas de segurança e fornecedores confiáveis.",
      ai_description: "Guia completo para iniciantes sobre como importar produtos da China de forma segura e lucrativa.",
      ai_generated_tags: ["importação", "china", "aliexpress", "produtos", "negócios"],
      ai_chapters: [
        { timestamp: "00:00", title: "Introdução" },
        { timestamp: "02:30", title: "Escolhendo fornecedores" },
        { timestamp: "08:15", title: "Processo de importação" }
      ],
      original_tags: ["importação", "china"],
      current_tags: ["importação", "china", "aliexpress"],
      created_at: "2024-06-20",
      updated_at: "2024-06-20"
    },
    {
      id: "2",
      youtube_id: "def456",
      youtube_url: "https://youtube.com/watch?v=def456",
      title: "Expandindo seu Negócio para o Exterior: Primeiros Passos",
      category_id: "2",
      category_name: "Internacionalização",
      configuration_status: "NEEDS_ATTENTION",
      update_status: "ACTIVE_FOR_UPDATE",
      video_type: "REGULAR",
      published_at: "2024-06-18",
      views: "8.3K",
      duration: "12:45",
      original_description: "Como expandir seu negócio para outros países...",
      has_transcription: false,
      ai_processed: false,
      created_at: "2024-06-18",
      updated_at: "2024-06-18"
    },
    {
      id: "3",
      youtube_id: "ghi789",
      youtube_url: "https://youtube.com/watch?v=ghi789",
      title: "Top 5 Produtos Amazon Mais Vendidos em 2024",
      category_id: "3",
      category_name: "Amazon",
      configuration_status: "CONFIGURED",
      update_status: "DO_NOT_UPDATE",
      video_type: "SHORT",
      published_at: "2024-06-15",
      views: "45.2K",
      duration: "0:58",
      original_description: "Os 5 produtos que mais vendem na Amazon...",
      has_transcription: true,
      ai_processed: true,
      ai_summary: "Lista dos 5 produtos mais vendidos na Amazon em 2024.",
      created_at: "2024-06-15",
      updated_at: "2024-06-15"
    },
    {
      id: "4",
      youtube_id: "jkl012",
      youtube_url: "https://youtube.com/watch?v=jkl012",
      title: "Análise de Mercado: Oportunidades 2024",
      configuration_status: "NOT_CONFIGURED",
      update_status: "ACTIVE_FOR_UPDATE",
      video_type: "REGULAR",
      published_at: "2024-06-10",
      views: "3.8K",
      duration: "18:22",
      has_transcription: false,
      ai_processed: false,
      created_at: "2024-06-10",
      updated_at: "2024-06-10"
    }
  ])

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

  const handleUpdateStatusToggle = (videoId: string, newStatus: string) => {
    setVideos(videos.map(video => 
      video.id === videoId 
        ? { ...video, update_status: newStatus as any }
        : video
    ))
    
    toast({
      title: "Status atualizado!",
      description: `Status de atualização alterado para: ${getUpdateStatusLabel(newStatus)}`,
    })
  }

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video)
    setShowModal(true)
  }

  const handleSaveVideo = (data: VideoFormData) => {
    if (!editingVideo) return

    const updatedVideos = videos.map(video =>
      video.id === editingVideo.id
        ? {
            ...video,
            category_id: data.category_id,
            category_name: categories.find(cat => cat.id === data.category_id)?.name,
            update_status: data.update_status as any,
            transcription: data.transcription,
            has_transcription: !!data.transcription,
            updated_at: new Date().toISOString()
          }
        : video
    )

    setVideos(updatedVideos)
    setEditingVideo(null)
    toast({
      title: "Vídeo atualizado!",
      description: "As alterações foram salvas com sucesso.",
    })
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingVideo(null)
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
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Sincronizar
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
                          <span>{video.views} views</span>
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
                        <FileText className="w-4 h-4 text-green-600" title="Tem transcrição" />
                      )}
                      {video.ai_processed && (
                        <Brain className="w-4 h-4 text-blue-600" title="Processado por IA" />
                      )}
                      <ExternalLink 
                        className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-blue-600" 
                        title="Ver no YouTube"
                        onClick={() => window.open(video.youtube_url, '_blank')}
                      />
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

          {filteredVideos.length === 0 && (
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
    </div>
  )
}
