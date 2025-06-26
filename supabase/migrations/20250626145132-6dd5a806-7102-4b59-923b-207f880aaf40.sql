
-- Adicionar novas colunas na tabela videos para armazenar todos os dados do YouTube
ALTER TABLE videos 
ADD COLUMN views_count BIGINT DEFAULT 0,
ADD COLUMN likes_count BIGINT DEFAULT 0,
ADD COLUMN comments_count BIGINT DEFAULT 0,
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN duration_seconds INTEGER DEFAULT 0,
ADD COLUMN duration_formatted TEXT,
ADD COLUMN privacy_status TEXT DEFAULT 'public',
ADD COLUMN category_id TEXT;

-- Adicionar índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_videos_views_count ON videos(views_count);
CREATE INDEX IF NOT EXISTS idx_videos_privacy_status ON videos(privacy_status);
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);
