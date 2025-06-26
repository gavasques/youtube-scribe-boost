
-- Criar tabelas especializadas seguindo Single Responsibility

-- 1. Tabela de metadados do YouTube
CREATE TABLE public.video_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  views_count BIGINT DEFAULT 0,
  likes_count BIGINT DEFAULT 0,
  comments_count BIGINT DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  duration_formatted TEXT,
  thumbnail_url TEXT,
  privacy_status TEXT DEFAULT 'public',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(video_id)
);

-- 2. Tabela de descrições (todas as versões)
CREATE TABLE public.video_descriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  original_description TEXT,
  current_description TEXT,
  compiled_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(video_id)
);

-- 3. Tabela de transcrições
CREATE TABLE public.video_transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  transcription TEXT,
  source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual', 'auto', 'uploaded')),
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(video_id)
);

-- 4. Tabela de conteúdo gerado por IA
CREATE TABLE public.video_ai_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  ai_summary TEXT,
  ai_description TEXT,
  ai_chapters JSONB,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(video_id)
);

-- 5. Tabela de tags normalizada
CREATE TABLE public.video_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  tag_text TEXT NOT NULL,
  tag_type TEXT DEFAULT 'current' CHECK (tag_type IN ('original', 'current', 'ai_generated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Tabela de configurações do vídeo
CREATE TABLE public.video_configuration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  configuration_status TEXT DEFAULT 'NOT_CONFIGURED' CHECK (configuration_status IN ('NOT_CONFIGURED', 'CONFIGURED', 'NEEDS_ATTENTION')),
  update_status TEXT DEFAULT 'ACTIVE_FOR_UPDATE' CHECK (update_status IN ('ACTIVE_FOR_UPDATE', 'DO_NOT_UPDATE', 'IGNORED')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(video_id)
);

-- Migrar dados existentes da tabela videos para as novas tabelas
INSERT INTO public.video_metadata (video_id, views_count, likes_count, comments_count, duration_seconds, duration_formatted, thumbnail_url, privacy_status, published_at)
SELECT id, COALESCE(views_count, 0), COALESCE(likes_count, 0), COALESCE(comments_count, 0), COALESCE(duration_seconds, 0), duration_formatted, thumbnail_url, COALESCE(privacy_status, 'public'), published_at
FROM public.videos;

INSERT INTO public.video_descriptions (video_id, original_description, current_description, compiled_description)
SELECT id, original_description, current_description, compiled_description
FROM public.videos;

INSERT INTO public.video_transcriptions (video_id, transcription, source_type)
SELECT id, transcription, 'manual'
FROM public.videos
WHERE transcription IS NOT NULL;

INSERT INTO public.video_ai_content (video_id, ai_summary, ai_description, ai_chapters, processing_status)
SELECT id, ai_summary, ai_description, ai_chapters, 
       CASE WHEN ai_summary IS NOT NULL OR ai_description IS NOT NULL OR ai_chapters IS NOT NULL THEN 'completed' ELSE 'pending' END
FROM public.videos;

INSERT INTO public.video_tags (video_id, tag_text, tag_type)
SELECT id, unnest(original_tags), 'original'
FROM public.videos
WHERE original_tags IS NOT NULL AND array_length(original_tags, 1) > 0
UNION ALL
SELECT id, unnest(current_tags), 'current'
FROM public.videos
WHERE current_tags IS NOT NULL AND array_length(current_tags, 1) > 0
UNION ALL
SELECT id, unnest(ai_generated_tags), 'ai_generated'
FROM public.videos
WHERE ai_generated_tags IS NOT NULL AND array_length(ai_generated_tags, 1) > 0;

INSERT INTO public.video_configuration (video_id, configuration_status, update_status)
SELECT id, COALESCE(configuration_status, 'NOT_CONFIGURED'), COALESCE(update_status, 'ACTIVE_FOR_UPDATE')
FROM public.videos;

-- Criar índices para performance
CREATE INDEX idx_video_metadata_video_id ON public.video_metadata(video_id);
CREATE INDEX idx_video_descriptions_video_id ON public.video_descriptions(video_id);
CREATE INDEX idx_video_transcriptions_video_id ON public.video_transcriptions(video_id);
CREATE INDEX idx_video_ai_content_video_id ON public.video_ai_content(video_id);
CREATE INDEX idx_video_tags_video_id ON public.video_tags(video_id);
CREATE INDEX idx_video_tags_type ON public.video_tags(tag_type);
CREATE INDEX idx_video_configuration_video_id ON public.video_configuration(video_id);
CREATE INDEX idx_video_configuration_status ON public.video_configuration(configuration_status, update_status);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.video_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_ai_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_configuration ENABLE ROW LEVEL SECURITY;

-- Políticas RLS baseadas no user_id da tabela videos
CREATE POLICY "Users can view their own video metadata" ON public.video_metadata
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_metadata.video_id AND v.user_id = auth.uid())
);

CREATE POLICY "Users can manage their own video metadata" ON public.video_metadata
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_metadata.video_id AND v.user_id = auth.uid())
);

CREATE POLICY "Users can view their own video descriptions" ON public.video_descriptions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_descriptions.video_id AND v.user_id = auth.uid())
);

CREATE POLICY "Users can manage their own video descriptions" ON public.video_descriptions
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_descriptions.video_id AND v.user_id = auth.uid())
);

CREATE POLICY "Users can view their own video transcriptions" ON public.video_transcriptions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_transcriptions.video_id AND v.user_id = auth.uid())
);

CREATE POLICY "Users can manage their own video transcriptions" ON public.video_transcriptions
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_transcriptions.video_id AND v.user_id = auth.uid())
);

CREATE POLICY "Users can view their own video AI content" ON public.video_ai_content
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_ai_content.video_id AND v.user_id = auth.uid())
);

CREATE POLICY "Users can manage their own video AI content" ON public.video_ai_content
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_ai_content.video_id AND v.user_id = auth.uid())
);

CREATE POLICY "Users can view their own video tags" ON public.video_tags
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_tags.video_id AND v.user_id = auth.uid())
);

CREATE POLICY "Users can manage their own video tags" ON public.video_tags
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_tags.video_id AND v.user_id = auth.uid())
);

CREATE POLICY "Users can view their own video configuration" ON public.video_configuration
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_configuration.video_id AND v.user_id = auth.uid())
);

CREATE POLICY "Users can manage their own video configuration" ON public.video_configuration
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_configuration.video_id AND v.user_id = auth.uid())
);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_metadata_updated_at BEFORE UPDATE ON public.video_metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_descriptions_updated_at BEFORE UPDATE ON public.video_descriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_transcriptions_updated_at BEFORE UPDATE ON public.video_transcriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_ai_content_updated_at BEFORE UPDATE ON public.video_ai_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_configuration_updated_at BEFORE UPDATE ON public.video_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
