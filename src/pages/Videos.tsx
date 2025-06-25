
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Filter, Upload, Eye, Edit, Sync } from "lucide-react"

export default function Videos() {
  const videos = [
    {
      id: "1",
      title: "Como Criar Apps com IA em 2024 - Tutorial Completo",
      status: "configured",
      updateStatus: "active",
      type: "regular",
      publishedAt: "2024-06-20",
      views: "12.5K",
      hasTranscription: true,
      aiProcessed: true
    },
    {
      id: "2", 
      title: "React + TypeScript: Guia Definitivo",
      status: "needs_attention",
      updateStatus: "active",
      type: "regular",
      publishedAt: "2024-06-18",
      views: "8.3K",
      hasTranscription: false,
      aiProcessed: false
    },
    {
      id: "3",
      title: "Dicas Rápidas: VS Code Extensions",
      status: "configured",
      updateStatus: "do_not_update",
      type: "short",
      publishedAt: "2024-06-15",
      views: "45.2K",
      hasTranscription: true,
      aiProcessed: true
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "configured":
        return <Badge variant="default" className="bg-green-100 text-green-800">Configurado</Badge>
      case "needs_attention":
        return <Badge variant="destructive">Requer Atenção</Badge>
      default:
        return <Badge variant="secondary">Não Configurado</Badge>
    }
  }

  const getUpdateStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="text-blue-600">Ativo</Badge>
      case "do_not_update":
        return <Badge variant="outline" className="text-gray-600">Não Atualizar</Badge>
      default:
        return <Badge variant="outline" className="text-red-600">Ignorado</Badge>
    }
  }

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
            <Sync className="w-4 h-4" />
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
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar vídeos..." className="pl-8" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Videos List */}
      <div className="space-y-4">
        {videos.map((video) => (
          <Card key={video.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{video.title}</h3>
                    {video.type === "short" && (
                      <Badge variant="outline" className="text-xs">Short</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span>Publicado em {video.publishedAt}</span>
                    <span>{video.views} visualizações</span>
                    <span>{video.hasTranscription ? "✓ Transcrição" : "✗ Sem transcrição"}</span>
                    <span>{video.aiProcessed ? "✓ IA Processada" : "✗ Não processada"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(video.status)}
                    {getUpdateStatusBadge(video.updateStatus)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
