
interface CategoryEmptyStateProps {
  hasCategories: boolean
  hasFilters: boolean
}

export function CategoryEmptyState({ hasCategories, hasFilters }: CategoryEmptyStateProps) {
  if (!hasCategories && !hasFilters) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhuma categoria encontrada. Crie sua primeira categoria!
        </p>
      </div>
    )
  }

  if (hasFilters) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhuma categoria corresponde ao termo de busca.
        </p>
      </div>
    )
  }

  return null
}
