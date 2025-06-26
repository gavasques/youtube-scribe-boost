
export const PROMPT_DEFAULTS = {
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 1000,
  DEFAULT_TOP_P: 0.9,
  DEFAULT_ACTIVE_STATUS: false,
  MIN_TEMPERATURE: 0,
  MAX_TEMPERATURE: 2,
  MIN_TOKENS: 1,
  MAX_TOKENS: 8000,
  MIN_TOP_P: 0,
  MAX_TOP_P: 1,
  TEMPERATURE_STEP: 0.1,
  TOP_P_STEP: 0.1
}

export const PROMPT_FORM_CONFIG = {
  FIELDS: {
    NAME: {
      id: 'name',
      label: 'Nome do Prompt',
      placeholder: 'Digite o nome do prompt',
      required: true
    },
    DESCRIPTION: {
      id: 'description', 
      label: 'Descrição',
      placeholder: 'Descreva brevemente o que este prompt faz'
    },
    PROMPT: {
      id: 'prompt',
      label: 'Prompt', 
      placeholder: 'Digite o prompt completo aqui. Use {transcription} para onde a transcrição será inserida...',
      minHeight: '200px',
      required: true
    },
    TEST_INPUT: {
      id: 'test_input',
      label: 'Texto de Teste',
      placeholder: 'Cole um texto para testar o prompt...',
      minHeight: '100px'
    }
  }
}

export const PROMPT_MESSAGES = {
  VALIDATION: {
    NAME_REQUIRED: 'Nome é obrigatório',
    PROMPT_REQUIRED: 'Prompt é obrigatório',
    MAX_TOKENS_REQUIRED: 'Max tokens é obrigatório',
    MIN_TOKENS: 'Mínimo 1 token',
    MAX_TOKENS_LIMIT: 'Máximo 8000 tokens',
    TEST_INPUT_REQUIRED: 'Digite um texto de teste para executar o prompt.'
  },
  SUCCESS: {
    CREATED: 'O prompt foi criado com sucesso.',
    UPDATED: 'O prompt foi atualizado com sucesso.',
    ACTIVATED: 'Prompt ativado',
    DEACTIVATED: 'Prompt desativado',
    DUPLICATED: 'Uma cópia do prompt foi criada e está inativa.',
    DELETED: 'foi removido com sucesso.',
    TEST_EXECUTED: 'O prompt foi testado com sucesso.'
  },
  ERROR: {
    LOAD: 'Erro ao carregar prompts.',
    CREATE: 'Erro ao criar prompt.',
    UPDATE: 'Erro ao atualizar prompt.',
    DELETE: 'Erro ao remover prompt.',
    DUPLICATE: 'Erro ao duplicar prompt.',
    TOGGLE: 'Erro ao alterar status do prompt.',
    AUTH: 'Você precisa estar logado',
    PERMISSION: 'Você só pode editar seus próprios prompts.',
    GLOBAL_DELETE: 'Prompts globais não podem ser removidos.'
  }
}
