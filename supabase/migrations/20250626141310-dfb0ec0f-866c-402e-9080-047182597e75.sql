
-- Remover tipos específicos e simplificar a estrutura da tabela prompts
-- Primeiro, vamos adicionar a nova coluna 'prompt' unificada
ALTER TABLE prompts ADD COLUMN prompt TEXT;

-- Migrar dados existentes: combinar system_prompt e user_prompt em um único campo
UPDATE prompts 
SET prompt = COALESCE(system_prompt, '') || 
  CASE 
    WHEN system_prompt IS NOT NULL AND user_prompt IS NOT NULL THEN E'\n\n' 
    ELSE '' 
  END || 
  COALESCE(user_prompt, '')
WHERE prompt IS NULL;

-- Tornar o campo prompt obrigatório
ALTER TABLE prompts ALTER COLUMN prompt SET NOT NULL;

-- Remover colunas desnecessárias
ALTER TABLE prompts DROP COLUMN IF EXISTS type;
ALTER TABLE prompts DROP COLUMN IF EXISTS system_prompt;
ALTER TABLE prompts DROP COLUMN IF EXISTS user_prompt;
ALTER TABLE prompts DROP COLUMN IF EXISTS version;

-- Atualizar constraint de temperature para ser mais flexível
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_temperature_check;
ALTER TABLE prompts ADD CONSTRAINT prompts_temperature_check 
  CHECK (temperature >= 0 AND temperature <= 2);

-- Atualizar constraint de max_tokens
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_max_tokens_check;
ALTER TABLE prompts ADD CONSTRAINT prompts_max_tokens_check 
  CHECK (max_tokens >= 1 AND max_tokens <= 8000);

-- Atualizar constraint de top_p
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_top_p_check;
ALTER TABLE prompts ADD CONSTRAINT prompts_top_p_check 
  CHECK (top_p >= 0 AND top_p <= 1);

-- Limpar dados de teste antigos se existirem
DELETE FROM prompts WHERE name LIKE '%Padrão%' OR name LIKE '%Avançado%';

-- Inserir prompts exemplo simplificados
INSERT INTO prompts (name, description, prompt, temperature, max_tokens, top_p, is_active) VALUES
(
  'Resumo de Vídeo',
  'Cria resumos envolventes a partir de transcrições de vídeos',
  'Analise a transcrição fornecida e crie um resumo estruturado em formato de tópicos. O resumo deve capturar os pontos principais do vídeo, manter o tom do criador, ser conciso mas informativo e usar emojis quando apropriado.

Transcrição: {transcription}',
  0.7,
  1000,
  0.9,
  true
),
(
  'Geração de Capítulos',
  'Identifica seções do vídeo e cria capítulos com timestamps',
  'Crie capítulos no formato timestamp para este vídeo. Analise a transcrição e identifique seções distintas. Formato:

00:00 Introdução
05:30 Tópico Principal
12:15 Exemplos Práticos

Transcrição: {transcription}',
  0.3,
  800,
  0.8,
  false
),
(
  'Descrição para YouTube',
  'Gera descrições otimizadas para SEO e engajamento',
  'Crie uma descrição envolvente para YouTube baseada na transcrição. A descrição deve ter um gancho inicial forte, incluir palavras-chave relevantes, ter call-to-action claro e ser estruturada e fácil de ler.

Transcrição: {transcription}',
  0.8,
  1200,
  0.9,
  false
);
