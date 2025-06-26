
import { Badge } from "@/components/ui/badge"
import { VIDEO_STATUS_LABELS, VIDEO_TYPE_LABELS, getStatusBadgeVariant, getStatusBadgeClassName } from "@/utils/videoConstants"

interface VideoStatusBadgesProps {
  configurationStatus: string
  videoType: string
}

export function VideoStatusBadges({ configurationStatus, videoType }: VideoStatusBadgesProps) {
  const getStatusBadge = (status: string) => {
    const variant = getStatusBadgeVariant(status)
    const className = getStatusBadgeClassName(status)
    
    return (
      <Badge variant={variant as any} className={className}>
        {VIDEO_STATUS_LABELS[status as keyof typeof VIDEO_STATUS_LABELS] || status}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => (
    <Badge variant={type === "SHORT" ? "secondary" : "outline"}>
      {VIDEO_TYPE_LABELS[type as keyof typeof VIDEO_TYPE_LABELS] || type}
    </Badge>
  )

  return (
    <>
      <td>{getStatusBadge(configurationStatus)}</td>
      <td>{getTypeBadge(videoType)}</td>
    </>
  )
}
