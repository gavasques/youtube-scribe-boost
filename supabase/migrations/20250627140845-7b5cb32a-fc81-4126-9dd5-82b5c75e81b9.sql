
-- Limpar todas as tabelas relacionadas aos vídeos (respeitando dependências)
DELETE FROM public.video_ai_content;
DELETE FROM public.video_configuration; 
DELETE FROM public.video_descriptions;
DELETE FROM public.video_metadata;
DELETE FROM public.video_tags;
DELETE FROM public.video_transcriptions;

-- Por último, limpar a tabela principal de vídeos
DELETE FROM public.videos;

-- Verificação: Contar registros restantes (deve retornar 0 para todas)
SELECT 
  (SELECT COUNT(*) FROM public.videos) as videos_count,
  (SELECT COUNT(*) FROM public.video_ai_content) as ai_content_count,
  (SELECT COUNT(*) FROM public.video_configuration) as configuration_count,
  (SELECT COUNT(*) FROM public.video_descriptions) as descriptions_count,
  (SELECT COUNT(*) FROM public.video_metadata) as metadata_count,
  (SELECT COUNT(*) FROM public.video_tags) as tags_count,
  (SELECT COUNT(*) FROM public.video_transcriptions) as transcriptions_count;
