
import { cn } from "@/lib/utils"

interface SkeletonTableProps {
  columns: number
  rows: number
  showHeader?: boolean
  className?: string
}

export function SkeletonTable({ columns, rows, showHeader = false, className }: SkeletonTableProps) {
  return (
    <div className={cn("w-full", className)}>
      {showHeader && (
        <div className="flex gap-4 border-b pb-3 mb-3">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={cn(
                  "h-4 bg-gray-200 rounded animate-pulse flex-1",
                  colIndex === 0 && "w-16 flex-none", // First column smaller (actions)
                  colIndex === 1 && "flex-2" // Second column larger (title)
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
