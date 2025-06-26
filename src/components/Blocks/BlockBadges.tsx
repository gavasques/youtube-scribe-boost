
import { Badge } from "@/components/ui/badge"
import { Calendar, Globe, FolderTree, FileText } from "lucide-react"
import { formatBlockType, formatBlockScope, formatBlockStatus, formatSchedulePeriod } from "@/utils/blockFormatters"
import { getBlockTypeIcon, getBlockTypeBadgeVariant, getBlockStatusBadgeVariant } from "@/utils/blockConstants"
import { BlockUI } from "@/types/block"

interface BlockTypeBadgeProps {
  type: string
}

export function BlockTypeBadge({ type }: BlockTypeBadgeProps) {
  const Icon = getBlockTypeIcon(type)
  const variant = getBlockTypeBadgeVariant(type)
  const className = type === 'MANUAL' ? 'border-blue-500 text-blue-700 bg-blue-50' : ''

  return (
    <Badge variant={variant as any} className={`gap-1 ${className}`}>
      <Icon className="w-3 h-3" />
      {formatBlockType(type)}
    </Badge>
  )
}

interface BlockStatusBadgeProps {
  isActive: boolean
  type?: string
}

export function BlockStatusBadge({ isActive, type }: BlockStatusBadgeProps) {
  const variant = getBlockStatusBadgeVariant(isActive, type)
  const className = type === 'MANUAL' ? 'bg-blue-600' : ''

  return (
    <Badge variant={variant as any} className={className}>
      {formatBlockStatus(isActive, type)}
    </Badge>
  )
}

interface BlockScopeBadgeProps {
  block: BlockUI
}

export function BlockScopeBadge({ block }: BlockScopeBadgeProps) {
  if (block.scope === "PERMANENT") {
    return <Badge variant="secondary">Permanente</Badge>
  }
  
  return (
    <Badge variant="outline" className="gap-1">
      <Calendar className="w-3 h-3" />
      {formatSchedulePeriod(block.scheduledStart, block.scheduledEnd)}
    </Badge>
  )
}
