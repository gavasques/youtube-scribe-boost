
export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const

export const APPROVAL_TYPES = {
  BLOCK_CHANGE: 'BLOCK_CHANGE',
  MASS_UPDATE: 'MASS_UPDATE',
  SYNC_OPERATION: 'SYNC_OPERATION',
  CATEGORY_CHANGE: 'CATEGORY_CHANGE',
  TAG_UPDATE: 'TAG_UPDATE',
  SEASONAL_TEMPLATE: 'SEASONAL_TEMPLATE'
} as const

export const APPROVAL_STATUS_COLORS = {
  PENDING: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200'
  },
  APPROVED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  REJECTED: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  }
}

export const APPROVAL_TYPE_COLORS = {
  BLOCK_CHANGE: { bg: 'bg-blue-100', text: 'text-blue-800' },
  MASS_UPDATE: { bg: 'bg-purple-100', text: 'text-purple-800' },
  SYNC_OPERATION: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  CATEGORY_CHANGE: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  TAG_UPDATE: { bg: 'bg-pink-100', text: 'text-pink-800' },
  SEASONAL_TEMPLATE: { bg: 'bg-indigo-100', text: 'text-indigo-800' }
}

export const APPROVAL_URGENCY_THRESHOLD = 50
export const APPROVAL_OLD_THRESHOLD_HOURS = 24

export const APPROVAL_MESSAGES = {
  CREATED: 'Uma nova aprovação foi criada e está pendente de revisão.',
  APPROVED: 'A aprovação foi aprovada e processada com sucesso.',
  REJECTED: 'A aprovação foi rejeitada.',
  ERROR: 'Erro ao processar aprovação.',
  URGENT: 'Urgente',
  OLD: 'Antiga'
}
