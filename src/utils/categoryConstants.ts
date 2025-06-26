
// Constantes para o módulo de categorias
export const CATEGORY_DEFAULTS = {
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  MIN_NAME_LENGTH: 1,
  DEFAULT_ACTIVE_STATUS: true,
  SEARCH_DEBOUNCE_MS: 300,
} as const

export const CATEGORY_MESSAGES = {
  CREATED: 'Categoria criada com sucesso',
  UPDATED: 'Categoria atualizada com sucesso', 
  DELETED: 'Categoria removida com sucesso',
  ACTIVATED: 'Categoria ativada',
  DEACTIVATED: 'Categoria desativada',
  ERRORS: {
    CREATE: 'Erro ao criar categoria',
    UPDATE: 'Erro ao atualizar categoria',
    DELETE: 'Erro ao remover categoria',
    TOGGLE: 'Erro ao alterar status da categoria',
    LOAD: 'Erro ao carregar categorias',
    NAME_REQUIRED: 'Nome é obrigatório',
    NAME_TOO_LONG: `Nome deve ter no máximo ${CATEGORY_DEFAULTS.MAX_NAME_LENGTH} caracteres`,
    DESCRIPTION_TOO_LONG: `Descrição deve ter no máximo ${CATEGORY_DEFAULTS.MAX_DESCRIPTION_LENGTH} caracteres`,
  }
} as const

export const CATEGORY_FORM_CONFIG = {
  FIELDS: {
    NAME: {
      id: 'name',
      label: 'Nome',
      placeholder: 'Nome da categoria',
      required: true,
    },
    DESCRIPTION: {
      id: 'description', 
      label: 'Descrição',
      placeholder: 'Descrição opcional da categoria',
      rows: 3,
    },
    ACTIVE: {
      id: 'is_active',
      label: 'Categoria ativa',
    }
  }
} as const
