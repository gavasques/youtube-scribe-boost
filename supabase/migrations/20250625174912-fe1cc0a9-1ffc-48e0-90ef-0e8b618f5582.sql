
-- Criar tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  youtube_channel_id TEXT UNIQUE,
  youtube_channel_name TEXT,
  youtube_access_token TEXT,
  youtube_refresh_token TEXT,
  youtube_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de vídeos
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  youtube_id TEXT UNIQUE NOT NULL,
  youtube_url TEXT NOT NULL,
  title TEXT NOT NULL,
  original_description TEXT,
  current_description TEXT,
  compiled_description TEXT,
  configuration_status TEXT DEFAULT 'NOT_CONFIGURED',
  update_status TEXT DEFAULT 'ACTIVE_FOR_UPDATE',
  video_type TEXT DEFAULT 'REGULAR',
  transcription TEXT,
  ai_summary TEXT,
  ai_chapters JSONB,
  ai_description TEXT,
  original_tags TEXT[] DEFAULT '{}',
  current_tags TEXT[] DEFAULT '{}',
  ai_generated_tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Criar tabela de blocos
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'GLOBAL',
  scope TEXT DEFAULT 'PERMANENT',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tabela users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Políticas RLS para tabela videos
CREATE POLICY "Users can view their own videos" ON videos
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own videos" ON videos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own videos" ON videos
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own videos" ON videos
  FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para tabela categories
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para tabela blocks
CREATE POLICY "Users can view their own blocks" ON blocks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own blocks" ON blocks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own blocks" ON blocks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own blocks" ON blocks
  FOR DELETE USING (user_id = auth.uid());
