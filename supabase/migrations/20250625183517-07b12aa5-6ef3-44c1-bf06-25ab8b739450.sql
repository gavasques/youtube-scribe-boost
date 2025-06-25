
-- Criar tabela para armazenar tokens OAuth do YouTube
CREATE TABLE public.youtube_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  channel_id TEXT,
  channel_name TEXT,
  channel_thumbnail TEXT,
  subscriber_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.youtube_tokens ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam apenas seus próprios tokens
CREATE POLICY "Users can view their own YouTube tokens" 
  ON public.youtube_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para inserir tokens
CREATE POLICY "Users can create their own YouTube tokens" 
  ON public.youtube_tokens 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para atualizar tokens
CREATE POLICY "Users can update their own YouTube tokens" 
  ON public.youtube_tokens 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para deletar tokens
CREATE POLICY "Users can delete their own YouTube tokens" 
  ON public.youtube_tokens 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Índice único para evitar múltiplas conexões por usuário
CREATE UNIQUE INDEX youtube_tokens_user_id_unique ON public.youtube_tokens(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_youtube_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_youtube_tokens_updated_at
  BEFORE UPDATE ON public.youtube_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_youtube_tokens_updated_at();
