
-- Inserir novo prompt para geração de tags de IA
INSERT INTO prompts (name, description, prompt, temperature, max_tokens, top_p, is_active, user_id) VALUES
(
  'Geração de Tags IA',
  'Gera tags otimizadas para SEO baseadas na descrição do vídeo',
  'Analise a descrição do vídeo fornecida e gere uma lista de tags relevantes e otimizadas para SEO do YouTube. As tags devem ser:

1. Relevantes ao conteúdo do vídeo
2. Populares para buscas no YouTube
3. Específicas e gerais (mix estratégico)
4. Entre 10-15 tags no total
5. Separadas por vírgulas
6. Em português brasileiro

Retorne APENAS a lista de tags separadas por vírgulas, sem numeração ou explicações adicionais.

Descrição do vídeo: {transcription}',
  0.3,
  500,
  0.8,
  true,
  NULL
);
