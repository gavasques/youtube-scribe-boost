
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useVideoModal } from "./VideoModalProvider"
import { Play, Eye, ThumbsUp, Calendar } from "lucide-react"

export function VideoBasicInfo() {
  const { video, setVideo, setIsDirty } = useVideoModal()

  if (!video) return null

  const handleTitleChange = (value: string) => {
    setVideo({ ...video, title: value })
    setIsDirty(true)
  }

  const handleDescriptionChange = (value: string) => {
    setVideo({ ...video, current_description: value })
    setIsDirty(true)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-4 h-4" />
          Informações Básicas
        </CardTitle>
        <CardDescription>
          Dados principais do vídeo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          {video.thumbnail_url && (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-32 h-18 object-cover rounded"
            />
          )}
          
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <Eye className="w-3 h-3" />
                {formatNumber(video.views_count)} views
              </Badge>
              <Badge variant="outline" className="gap-1">
                <ThumbsUp className="w-3 h-3" />
                {formatNumber(video.likes_count)} likes
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(video.published_at).toLocaleDateString('pt-BR')}
              </Badge>
              {video.duration_formatted && (
                <Badge variant="secondary">
                  {video.duration_formatted}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-title">Título</Label>
          <Input
            id="video-title"
            value={video.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Título do vídeo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-description">Descrição Atual</Label>
          <Textarea
            id="video-description"
            value={video.current_description || ''}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Descrição atual do vídeo"
            rows={6}
            className="min-h-[150px]"
          />
          <p className="text-xs text-muted-foreground">
            {video.current_description?.length || 0} caracteres
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
