
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Youtube } from "lucide-react"
import { ReactNode } from "react"

interface VideoHeaderProps {
  onSyncModal: () => void
  onRefresh: () => void
  extraActions?: ReactNode
}

export function VideoHeader({ onSyncModal, onRefresh, extraActions }: VideoHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Vídeos</CardTitle>
        <CardDescription>
          Gerencie as descrições e configurações dos seus vídeos do YouTube
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onSyncModal} className="gap-2">
            <Youtube className="w-4 h-4" />
            Sincronizar YouTube
          </Button>
          <Button onClick={onRefresh} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar Lista
          </Button>
          {extraActions}
        </div>
      </CardContent>
    </Card>
  )
}
