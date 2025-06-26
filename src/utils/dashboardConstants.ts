
export const DASHBOARD_METRICS = {
  TOTAL_VIDEOS: 'total_videos',
  ACTIVE_BLOCKS: 'active_blocks',
  CATEGORIES: 'categories',
  PENDING_VIDEOS: 'pending_videos',
  IGNORED_VIDEOS: 'ignored_videos'
} as const

export const METRIC_COLORS = {
  [DASHBOARD_METRICS.TOTAL_VIDEOS]: {
    border: 'border-l-4 border-red-500',
    gradient: 'bg-gradient-to-br from-red-50 to-rose-50'
  },
  [DASHBOARD_METRICS.ACTIVE_BLOCKS]: {
    border: 'border-l-4 border-purple-500',
    gradient: 'bg-gradient-to-br from-purple-50 to-violet-50'
  },
  [DASHBOARD_METRICS.CATEGORIES]: {
    border: 'border-l-4 border-emerald-500',
    gradient: 'bg-gradient-to-br from-emerald-50 to-teal-50'
  },
  [DASHBOARD_METRICS.PENDING_VIDEOS]: {
    border: 'border-l-4 border-amber-500',
    gradient: 'bg-gradient-to-br from-amber-50 to-yellow-50'
  },
  [DASHBOARD_METRICS.IGNORED_VIDEOS]: {
    border: 'border-l-4 border-cyan-500',
    gradient: 'bg-gradient-to-br from-cyan-50 to-blue-50'
  }
}

export const QUICK_ACTIONS = [
  {
    id: 'connect_youtube',
    title: 'Conectar YouTube',
    description: 'Conecte sua conta do YouTube para começar',
    route: '/settings'
  },
  {
    id: 'create_block',
    title: 'Criar Primeiro Bloco',
    description: 'Crie seu primeiro bloco de conteúdo',
    route: '/blocks'
  },
  {
    id: 'add_category',
    title: 'Adicionar Categoria',
    description: 'Organize seus vídeos por categorias',
    route: '/categories'
  },
  {
    id: 'configure_ai',
    title: 'Configurar IA',
    description: 'Configure os prompts de IA',
    route: '/prompts'
  }
]

export const ACTIVITY_TYPES = {
  SYSTEM: 'system',
  BLOCK: 'block',
  CATEGORY: 'category',
  VIDEO: 'video',
  APPROVAL: 'approval'
} as const
