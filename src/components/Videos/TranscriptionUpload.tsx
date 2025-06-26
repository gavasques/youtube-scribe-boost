
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { parseFile, isValidFileType, getFileTypeDisplayName, getFileTypeRecommendation } from '@/utils/fileParserUtils'

interface TranscriptionUploadProps {
  value: string
  onChange: (value: string) => void
  onFileUpload: (file: File) => Promise<string>
  processing?: boolean
  progress?: number
}

export function TranscriptionUpload({ 
  value, 
  onChange, 
  onFileUpload, 
  processing = false,
  progress = 0 
}: TranscriptionUploadProps) {
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [lastUploadInfo, setLastUploadInfo] = useState<{
    fileName: string
    fileType: string
    encoding?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
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
      onChange(parsed.content)
      
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
      
      // Optionally call the original onFileUpload for compatibility
      if (onFileUpload) {
        await onFileUpload(file)
      }
      
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Erro ao processar arquivo')
      setLastUploadInfo(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
    // Reset input to allow re-uploading same file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const wordCount = value.split(/\s+/).filter(Boolean).length
  const charCount = value.length

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Upload de Transcrição</Label>
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
            Formatos suportados (máximo 10MB):
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
            disabled={processing || uploading}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            {uploading ? 'Processando...' : 'Selecionar Arquivo'}
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".txt,.docx,.csv,.srt,.vtt"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </div>

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

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

      <div className="space-y-2">
        <Label htmlFor="transcription-text">Transcrição Manual</Label>
        <Textarea
          id="transcription-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cole ou digite a transcrição do vídeo aqui..."
          className="min-h-[200px] font-mono text-sm"
          disabled={processing || uploading}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{wordCount} palavras • {charCount} caracteres</span>
          {value.length > 0 && (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Pronto para processar
            </span>
          )}
        </div>
      </div>

      {processing && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">Processando com IA...</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  )
}
