
import { Switch } from "@/components/ui/switch"
import { UPDATE_STATUS_LABELS } from "@/utils/videoConstants"

interface VideoUpdateStatusProps {
  updateStatus: string
  onToggle: (checked: boolean) => void
}

export function VideoUpdateStatus({ updateStatus, onToggle }: VideoUpdateStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={updateStatus === "ACTIVE_FOR_UPDATE"}
        onCheckedChange={onToggle}
      />
      <span className="text-sm text-muted-foreground">
        {UPDATE_STATUS_LABELS[updateStatus as keyof typeof UPDATE_STATUS_LABELS] || updateStatus}
      </span>
    </div>
  )
}
