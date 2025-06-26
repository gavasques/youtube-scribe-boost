
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SkeletonTable } from "@/components/ui/skeleton-table"

interface OptimizedLoadingProps {
  type: 'blocks' | 'categories' | 'form'
  message?: string
}

export function OptimizedLoading({ type, message }: OptimizedLoadingProps) {
  if (type === 'blocks') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <SkeletonTable columns={7} rows={5} showHeader={true} />
      </div>
    )
  }

  if (type === 'categories') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-muted-foreground">
            {message || 'Carregando categorias...'}
          </span>
        </div>
      </div>
    )
  }

  if (type === 'form') {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-muted-foreground">
            {message || 'Carregando...'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-2 text-muted-foreground">{message || 'Carregando...'}</p>
      </div>
    </div>
  )
}
