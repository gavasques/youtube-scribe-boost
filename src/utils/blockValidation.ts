
export const validateBlockForm = (data: any) => {
  const errors: Record<string, string> = {}

  if (!data.title?.trim()) {
    errors.title = 'Título é obrigatório'
  }

  if (!data.content?.trim()) {
    errors.content = 'Conteúdo é obrigatório'
  }

  if (data.type === 'CATEGORY_SPECIFIC' && (!data.categories || data.categories.length === 0)) {
    errors.categories = 'Selecione pelo menos uma categoria'
  }

  if (data.scope === 'SCHEDULED') {
    if (!data.scheduledStart) {
      errors.scheduledStart = 'Data de início é obrigatória'
    }
    if (!data.scheduledEnd) {
      errors.scheduledEnd = 'Data de fim é obrigatória'
    }
    if (data.scheduledStart && data.scheduledEnd && data.scheduledStart >= data.scheduledEnd) {
      errors.scheduledEnd = 'Data de fim deve ser posterior à data de início'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const getBlockContent = (block: any): string => {
  if (block.type === 'MANUAL') {
    return 'Este bloco representa onde as descrições dos vídeos aparecem na compilação final. A posição dele na lista define onde as descrições ficam em relação aos outros blocos.'
  }
  return block.content
}

export const getBlockPermissions = (blockType: string) => ({
  canEdit: canEditBlock(blockType),
  canDelete: canDeleteBlock(blockType),
  canToggle: canToggleBlock(blockType)
})

function canEditBlock(type: string): boolean {
  return type !== 'MANUAL'
}

function canDeleteBlock(type: string): boolean {
  return type !== 'MANUAL'
}

function canToggleBlock(type: string): boolean {
  return type !== 'MANUAL'
}
