
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useMassVideoUpdate } from "@/hooks/useMassVideoUpdate"
import { VideoWithRelations } from "@/features/videos/types/normalized"
import { FolderOpen, Loader2 } from "lucide-react"

interface MassUpdateButtonProps {
  videos: VideoWithRelations[]
  onUpdateComplete: () => void
}

export function MassUpdateButton({ videos, onUpdateComplete }: MassUpdateButtonProps) {
  const { updateAllVideosToCategory, updating } = useMassVideoUpdate()

  const handleUpdateToAmazon = async () => {
    try {
      await updateAllVideosToCategory("Amazon", videos)
      onUpdateComplete()
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={updating || videos.length === 0}
          className="gap-2"
        >
          {updating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FolderOpen className="w-4 h-4" />
          )}
          Mover todos para Amazon
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mover todos os vídeos para categoria "Amazon"</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá mover todos os {videos.length} vídeos visíveis para a categoria "Amazon". 
            Se a categoria não existir, ela será criada automaticamente.
            <br /><br />
            Esta operação não pode ser desfeita facilmente. Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdateToAmazon} disabled={updating}>
            {updating ? "Atualizando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
