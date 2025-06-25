
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Video, 
  Tag,
  FolderTree,
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import { Approval } from '@/types/approval'

interface ApprovalPreviewProps {
  approval: Approval
}

export function ApprovalPreview({ approval }: ApprovalPreviewProps) {
  const renderBlockChangePreview = () => {
    const { block_before, block_after, affected_videos } = approval.data

    return (
      <div className="space-y-4">
        {/* Diff do Bloco */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Alterações no Bloco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Antes */}
              <div className="space-y-2">
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  Antes
                </Badge>
                <div className="bg-red-50 p-3 rounded-md border border-red-200">
                  <pre className="text-sm whitespace-pre-wrap">
                    {block_before?.content || 'Bloco vazio'}
                  </pre>
                </div>
              </div>

              {/* Depois */}
              <div className="space-y-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Depois
                </Badge>
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <pre className="text-sm whitespace-pre-wrap">
                    {block_after?.content || 'Bloco vazio'}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vídeos Afetados */}
        {affected_videos && affected_videos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5" />
                Vídeos que Serão Afetados ({affected_videos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {affected_videos.slice(0, 10).map((video: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{video.title}</span>
                  </div>
                ))}
                {affected_videos.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    ... e mais {affected_videos.length - 10} vídeos
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderMassUpdatePreview = () => {
    const { operation_type, changes, affected_videos } = approval.data

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Atualização em Massa - {operation_type}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(changes || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{key}:</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span>{JSON.stringify(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {affected_videos && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5" />
                Vídeos Afetados ({affected_videos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {affected_videos.slice(0, 10).map((video: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{video.title}</span>
                  </div>
                ))}
                {affected_videos.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    ... e mais {affected_videos.length - 10} vídeos
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderTagUpdatePreview = () => {
    const { tags_before, tags_after, affected_videos } = approval.data

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Alterações nas Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Tags Antes */}
              <div className="space-y-2">
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  Tags Antes
                </Badge>
                <div className="flex flex-wrap gap-1">
                  {(tags_before || []).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tags Depois */}
              <div className="space-y-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Tags Depois
                </Badge>
                <div className="flex flex-wrap gap-1">
                  {(tags_after || []).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {affected_videos && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5" />
                Vídeos Afetados ({affected_videos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {affected_videos.slice(0, 10).map((video: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{video.title}</span>
                  </div>
                ))}
                {affected_videos.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    ... e mais {affected_videos.length - 10} vídeos
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderCategoryChangePreview = () => {
    const { category_before, category_after, affected_videos } = approval.data

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Mudança de Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <Badge variant="outline" className="bg-red-50 text-red-700 mb-2">
                  Categoria Atual
                </Badge>
                <p className="text-sm font-medium">
                  {category_before?.name || 'Sem categoria'}
                </p>
              </div>
              
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              
              <div className="text-center">
                <Badge variant="outline" className="bg-green-50 text-green-700 mb-2">
                  Nova Categoria
                </Badge>
                <p className="text-sm font-medium">
                  {category_after?.name || 'Sem categoria'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {affected_videos && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5" />
                Vídeos que Mudarão de Categoria ({affected_videos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {affected_videos.slice(0, 10).map((video: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{video.title}</span>
                  </div>
                ))}
                {affected_videos.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    ... e mais {affected_videos.length - 10} vídeos
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderGenericPreview = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Operação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md overflow-auto max-h-60">
            {JSON.stringify(approval.data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    )
  }

  const renderPreview = () => {
    switch (approval.type) {
      case 'BLOCK_CHANGE':
        return renderBlockChangePreview()
      case 'MASS_UPDATE':
        return renderMassUpdatePreview()
      case 'TAG_UPDATE':
        return renderTagUpdatePreview()
      case 'CATEGORY_CHANGE':
        return renderCategoryChangePreview()
      case 'SYNC_OPERATION':
      case 'SEASONAL_TEMPLATE':
      default:
        return renderGenericPreview()
    }
  }

  return (
    <div className="space-y-4">
      {renderPreview()}
    </div>
  )
}
