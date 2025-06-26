
import { Button } from "@/components/ui/button"
import { Upload, RefreshCw, Youtube } from "lucide-react"

interface VideoHeaderProps {
  onSyncModal: () => void
  onRefresh: () => void
  onUpload?: () => void
}

export function VideoHeader({ onSyncModal, onRefresh, onUpload }: VideoHeaderProps) {
  return (
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
          onClick={onSyncModal}
        >
          <Youtube className="w-4 h-4" />
          Sincronizar com YouTube
        </Button>
        <Button variant="outline" className="gap-2" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
        {onUpload && (
          <Button className="gap-2" onClick={onUpload}>
            <Upload className="w-4 h-4" />
            Upload Transcrição
          </Button>
        )}
      </div>
    </div>
  )
}
