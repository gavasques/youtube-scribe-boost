
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useVideoModal } from "./VideoModalProvider"
import { FileText, Upload, Wand2, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { useState, useRef } from "react"
import { parseFile, isValidFileType, getFileTypeDisplayName, getFileTypeRecommendation } from "@/utils/fileParserUtils"

export function VideoTranscription() {
  const { video, setVideo, setIsDirty } = useVideoModal()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [lastUploadInfo, setLastUploadInfo] = useState<{
    fileName: string
    fileType: string
    encoding?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!video) return null

  const handleTranscriptionChange = (value: string) => {
    setVideo({ ...video, transcription: value })
    setIsDirty(true)
  }

  const handleFileUpload = async (file: File) => {
    if (!isValidFileType(file)) {
      setUploadError('Tipo de arquivo não suportado. Use: .txt (recomendado), .docx, .csv, .srt, .vtt')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadWarnings([])

    try {
      const parsed = await parseFile(file)
      
      // Set the content
      handleTranscriptionChange(parsed.content)
      
      // Store upload info
      setLastUploadInfo({
        fileName: file.name,
        fileType: parsed.fileType,
        encoding: parsed.encoding
      })
      
      // Show warnings if any
      if (parsed.warnings && parsed.warnings.length > 0) {
        setUploadWarnings(parsed.warnings)
      }
      
      console.log(`Arquivo processado: ${parsed.fileType.toUpperCase()}, ${parsed.wordCount} palavras, ${parsed.characterCount} caracteres`)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Erro ao processar arquivo')
      setLastUploadInfo(null)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      await handleFileUpload(files[0])
    }
    // Reset input value to allow re-uploading same file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const hasTranscription = video.transcription && video.transcription.length > 0
  const wordCount = video.transcription?.split(/\s+/).filter(Boolean).length || 0
  const charCount = video.transcription?.length || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Transcrição
          {hasTranscription && (
            <Badge variant="default" className="ml-auto bg-green-100 text-green-800 border-green-200">
              Disponível
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Texto completo do vídeo para processamento por IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="space-y-2">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Arraste um arquivo de transcrição ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Formatos: .txt (recomendado), .docx, .csv, .srt, .vtt (máximo 10MB)
            </p>
            <div className="flex flex-wrap gap-1 justify-center mb-3">
              {['txt', 'docx', 'csv', 'srt', 'vtt'].map(ext => (
                <Badge 
                  key={ext} 
                  variant={ext === 'txt' ? 'default' : 'outline'} 
                  className={`text-xs ${ext === 'txt' ? 'bg-green-100 text-green-800' : ''}`}
                  title={getFileTypeRecommendation(ext)}
                >
                  {getFileTypeDisplayName(ext)}
                </Badge>
              ))}
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              {uploading ? 'Processando...' : 'Selecionar Arquivo'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.docx,.csv,.srt,.vtt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Upload Error */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Upload Warnings */}
        {uploadWarnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Avisos sobre o arquivo:</p>
                {uploadWarnings.map((warning, index) => (
                  <p key={index} className="text-sm">• {warning}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Success Info */}
        {lastUploadInfo && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm">
                <p><strong>Arquivo processado:</strong> {lastUploadInfo.fileName}</p>
                <p><strong>Tipo:</strong> {lastUploadInfo.fileType.toUpperCase()}</p>
                {lastUploadInfo.encoding && (
                  <p><strong>Codificação:</strong> {lastUploadInfo.encoding}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Auto-gerar (em breve)
          </Button>
        </div>

        {/* Manual Input */}
        <div className="space-y-2">
          <Textarea
            value={video.transcription || ''}
            onChange={(e) => handleTranscriptionChange(e.target.value)}
            placeholder="Cole ou digite a transcrição do vídeo aqui..."
            rows={8}
            className="min-h-[200px] font-mono text-sm"
            disabled={uploading}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{wordCount} palavras • {charCount} caracteres</span>
            {hasTranscription && (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Pronto para IA
              </span>
            )}
          </div>
        </div>

        {/* Status Info */}
        {!hasTranscription && (
          <div className="bg-muted/50 p-4 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground text-center">
              Adicione uma transcrição para gerar conteúdo com IA
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
