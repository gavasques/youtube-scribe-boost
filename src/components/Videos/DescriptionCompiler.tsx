
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Eye, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Youtube,
  Copy,
  RefreshCw
} from 'lucide-react'
import { Video } from '@/types/video'
import { useDescriptionCompiler } from '@/hooks/useDescriptionCompiler'
import { useToast } from '@/hooks/use-toast'

interface DescriptionCompilerProps {
  video: Video
  onUpdate?: () => void
}

export function DescriptionCompiler({ video, onUpdate }: DescriptionCompilerProps) {
  const { toast } = useToast()
  const { compiling, applying, compileDescription, applyToYouTube } = useDescriptionCompiler()
  
  const [compilationResult, setCompilationResult] = useState<any>(null)
  const [editedDescription, setEditedDescription] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Compilar automaticamente quando o componente carrega
  useEffect(() => {
    handleCompile()
  }, [video.id])

  const handleCompile = async () => {
    try {
      const result = await compileDescription(video)
      setCompilationResult(result)
      setEditedDescription(result.compiledDescription)
      setIsEditing(false)
    } catch (error) {
      console.error('Erro na compilação:', error)
      toast({
        title: 'Erro na compilação',
        description: 'Não foi possível compilar a descrição.',
        variant: 'destructive'
      })
    }
  }

  const handleApplyToYouTube = async () => {
    if (!compilationResult) return
    
    try {
      const descriptionToApply = isEditing ? editedDescription : compilationResult.compiledDescription
      await applyToYouTube(video, descriptionToApply)
      onUpdate?.()
    } catch (error) {
      // Erro já tratado no hook
    }
  }

  const handleCopyDescription = async () => {
    const descriptionToCopy = isEditing ? editedDescription : compilationResult?.compiledDescription
    if (descriptionToCopy) {
      await navigator.clipboard.writeText(descriptionToCopy)
      toast({
        title: 'Descrição copiada!',
        description: 'A descrição foi copiada para a área de transferência.',
      })
    }
  }

  const getCharacterProgressColor = (count: number) => {
    if (count > 4500) return 'bg-red-500'
    if (count > 4000) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compilação de Descrição</h3>
          <p className="text-sm text-muted-foreground">
            Preview da descrição final com blocos aplicados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCompile}
            disabled={compiling}
            className="gap-2"
          >
            {compiling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {compiling ? 'Compilando...' : 'Recompilar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyDescription}
            disabled={!compilationResult}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Copiar
          </Button>
        </div>
      </div>

      {compiling && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Compilando descrição...</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {compilationResult && (
        <>
          {/* Alertas e avisos */}
          {compilationResult.warnings.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {compilationResult.warnings.map((warning, index) => (
                    <div key={index}>{warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Status da compilação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Compilação Concluída
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Blocos aplicados:</span>
                  <div className="font-medium">{compilationResult.appliedBlocks.length}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Caracteres:</span>
                  <div className="font-medium">{compilationResult.characterCount}/5000</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Conteúdo IA:</span>
                  <div className="font-medium">{video.ai_description ? 'Sim' : 'Não'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Capítulos:</span>
                  <div className="font-medium">
                    {video.ai_chapters && Array.isArray(video.ai_chapters) ? video.ai_chapters.length : 0}
                  </div>
                </div>
              </div>
              
              {/* Barra de progresso de caracteres */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Uso de caracteres</span>
                  <span>{((compilationResult.characterCount / 5000) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getCharacterProgressColor(compilationResult.characterCount)}`}
                    style={{ width: `${Math.min((compilationResult.characterCount / 5000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blocos aplicados */}
          {compilationResult.appliedBlocks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Blocos Aplicados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {compilationResult.appliedBlocks.map((block, index) => (
                    <div key={block.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Badge variant="outline" className="shrink-0">
                        #{index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{block.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Prioridade: {block.priority} • Tipo: {block.type}
                        </div>
                      </div>
                      <Badge 
                        variant={block.type === 'GLOBAL' ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {block.type === 'GLOBAL' ? 'Global' : 'Categoria'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparação lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  Descrição Atual (YouTube)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={video.current_description || video.original_description || "Nenhuma descrição disponível"}
                  readOnly
                  className="bg-red-50 border-red-200 min-h-[300px] text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Nova Descrição (Compilada)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={isEditing ? editedDescription : compilationResult.compiledDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  readOnly={!isEditing}
                  className={`${isEditing ? 'bg-white' : 'bg-green-50 border-green-200'} min-h-[300px] text-sm`}
                />
                <div className="flex justify-between items-center mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancelar Edição' : 'Editar Manualmente'}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {isEditing ? editedDescription.length : compilationResult.characterCount} caracteres
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações finais */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setEditedDescription(compilationResult.compiledDescription)
                setIsEditing(false)
              }}
            >
              Descartar Alterações
            </Button>
            <Button
              onClick={handleApplyToYouTube}
              disabled={applying}
              className="gap-2"
            >
              {applying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Aplicar no YouTube
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
