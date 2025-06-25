
-- Criar tabela para armazenar prompts de IA
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('SUMMARY_GENERATOR', 'CHAPTER_GENERATOR', 'DESCRIPTION_GENERATOR', 'TAG_GENERATOR', 'CATEGORY_CLASSIFIER')),
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens >= 100),
  top_p DECIMAL(3,2) DEFAULT 0.9 CHECK (top_p >= 0 AND top_p <= 1),
  is_active BOOLEAN DEFAULT FALSE,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela prompts
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tabela prompts
CREATE POLICY "Users can view their own prompts" ON prompts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own prompts" ON prompts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own prompts" ON prompts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own prompts" ON prompts
  FOR DELETE USING (user_id = auth.uid());

-- Inserir prompts padrão (serão associados ao primeiro usuário que fizer login)
INSERT INTO prompts (name, description, type, system_prompt, user_prompt, temperature, max_tokens, top_p, is_active, version) VALUES
(
  'Gerador de Resumo Padrão',
  'Cria resumos estruturados e envolventes a partir de transcrições de vídeos',
  'SUMMARY_GENERATOR',
  'Você é um especialista em síntese de conteúdo audiovisual. Sua tarefa é criar resumos concisos e envolventes que capturem os pontos principais do vídeo, mantendo o tom e estilo do criador de conteúdo.',
  'Analise a transcrição fornecida e crie um resumo estruturado em formato de tópicos. O resumo deve:

1. Capturar os pontos principais do vídeo
2. Manter o tom do criador
3. Ser conciso mas informativo
4. Usar emojis quando apropriado

Transcrição:
{transcription}',
  0.7,
  1000,
  0.9,
  true,
  '1.0'
),
(
  'Gerador de Capítulos Avançado',
  'Identifica seções do vídeo e cria capítulos com timestamps precisos',
  'CHAPTER_GENERATOR',
  'Você é um especialista em criação de capítulos para vídeos no YouTube. Analise o conteúdo e identifique mudanças naturais de tópico para criar capítulos úteis.',
  'Crie capítulos no formato timestamp para este vídeo. Analise a transcrição e identifique seções distintas. Formato:

00:00 Introdução
05:30 Tópico Principal
12:15 Exemplos Práticos

Transcrição:
{transcription}',
  0.3,
  800,
  0.8,
  true,
  '1.2'
),
(
  'Descrição Otimizada para YouTube',
  'Gera descrições otimizadas para SEO e engajamento no YouTube',
  'DESCRIPTION_GENERATOR',
  'Você é um especialista em copywriting para YouTube e otimização SEO. Crie descrições que aumentem o engajamento e a descoberta do vídeo.',
  'Crie uma descrição envolvente para YouTube baseada na transcrição. A descrição deve:

- Ter um gancho inicial forte
- Incluir palavras-chave relevantes
- Ter call-to-action claro
- Ser estruturada e fácil de ler

Transcrição:
{transcription}',
  0.8,
  1200,
  0.9,
  false,
  '2.0'
),
(
  'Tags SEO Inteligentes',
  'Gera tags relevantes e otimizadas baseadas no conteúdo do vídeo',
  'TAG_GENERATOR',
  'Você é um especialista em SEO para YouTube. Gere tags que ajudem na descoberta do vídeo, combinando palavras-chave populares com termos específicos do nicho.',
  'Gere tags relevantes baseadas na transcrição do vídeo. Inclua:

- Tags principais (3-5)
- Tags secundárias (5-8) 
- Tags de nicho específico
- Variações de palavras-chave

Formate como lista separada por vírgulas.

Transcrição:
{transcription}',
  0.5,
  500,
  0.7,
  true,
  '1.1'
);
