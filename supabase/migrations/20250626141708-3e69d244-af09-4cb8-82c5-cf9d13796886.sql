
-- Habilitar RLS na tabela prompts se não estiver habilitado
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can create their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update their own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.prompts;

-- Criar políticas RLS que permitem acesso a prompts globais (user_id NULL) e prompts do usuário
CREATE POLICY "Users can view prompts" 
  ON public.prompts 
  FOR SELECT 
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create their own prompts" 
  ON public.prompts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts" 
  ON public.prompts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts" 
  ON public.prompts 
  FOR DELETE 
  USING (auth.uid() = user_id);
