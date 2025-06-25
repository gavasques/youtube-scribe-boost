
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

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
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    try {
      setUploadError(null)
      
      // Validar tipo de arquivo
      const validTypes = ['.txt', '.srt', '.vtt']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!validTypes.includes(fileExtension)) {
        throw new Error('Tipo de arquivo não suportado. Use .txt, .srt ou .vtt')
      }

      // Validar tamanho
      if (file.size > 100000) { // 100KB
        throw new Error('Arquivo muito grande. Máximo 100KB.')
      }

      const content = await onFileUpload(file)
      onChange(content)
      
    } catch (error) {
      setUploadError(error.message)
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
            Formatos suportados: .txt, .srt, .vtt (máximo 100KB)
          </p>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            <FileText className="w-4 h-4 mr-2" />
            Selecionar Arquivo
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".txt,.srt,.vtt"
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

      <div className="space-y-2">
        <Label htmlFor="transcription-text">Transcrição Manual</Label>
        <Textarea
          id="transcription-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cole ou digite a transcrição do vídeo aqui..."
          className="min-h-[200px]"
          disabled={processing}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{wordCount} palavras</span>
          <span>{charCount} caracteres</span>
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
