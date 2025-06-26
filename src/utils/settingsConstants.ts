
export const API_SERVICES = {
  OPENAI: 'openai',
  BITLY: 'bitly',
  YOUTUBE: 'youtube'
} as const

export const API_SERVICE_LABELS = {
  [API_SERVICES.OPENAI]: 'OpenAI',
  [API_SERVICES.BITLY]: 'Bitly',
  [API_SERVICES.YOUTUBE]: 'YouTube'
} as const

export const API_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
} as const

export const API_STATUS_LABELS = {
  [API_STATUS.CONNECTED]: 'Conectado',
  [API_STATUS.DISCONNECTED]: 'Desconectado',
  [API_STATUS.ERROR]: 'Erro'
} as const

export const OPENAI_MODELS = {
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4O: 'gpt-4o',
  GPT_3_5_TURBO: 'gpt-3.5-turbo'
} as const

export const OPENAI_VALIDATION = {
  MIN_TEMPERATURE: 0,
  MAX_TEMPERATURE: 1,
  MIN_TOKENS: 100,
  MAX_TOKENS: 4000,
  KEY_PREFIX: 'sk-'
} as const

export const BITLY_VALIDATION = {
  CUSTOM_DOMAIN_PATTERN: /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/
} as const

export const FORM_VALIDATION = {
  EMAIL_MIN_LENGTH: 1,
  PASSWORD_MIN_LENGTH: 6,
  API_KEY_MIN_LENGTH: 1
} as const
