
import { Badge } from "@/components/ui/badge"
import { getStatusBadgeConfig } from "@/utils/settingsFormatters"

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = getStatusBadgeConfig(status)
  const Icon = config.icon

  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center gap-1 ${config.className} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {config.text}
    </Badge>
  )
}
