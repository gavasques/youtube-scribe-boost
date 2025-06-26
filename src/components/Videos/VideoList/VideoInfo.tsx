
import { formatViews, formatDate } from "@/utils/videoFormatters"

interface VideoInfoProps {
  title: string
  viewsCount: number
  publishedAt: string | null
  durationFormatted: string | null
  likesCount: number
}

export function VideoInfo({ title, viewsCount, publishedAt, durationFormatted, likesCount }: VideoInfoProps) {
  return (
    <div className="flex-1 min-w-0">
      <p className="font-medium line-clamp-2 text-sm">
        {title}
      </p>
      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
        <span>{formatViews(viewsCount)} views</span>
        <span>•</span>
        <span>{formatDate(publishedAt)}</span>
        {durationFormatted && (
          <>
            <span>•</span>
            <span>{durationFormatted}</span>
          </>
        )}
        {likesCount > 0 && (
          <>
            <span>•</span>
            <span>{formatViews(likesCount)} curtidas</span>
          </>
        )}
      </div>
    </div>
  )
}
