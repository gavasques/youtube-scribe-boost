
-- Remover a constraint incorreta atual
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_user_id_fkey;

-- Adicionar a constraint correta que referencia auth.users
ALTER TABLE public.blocks 
ADD CONSTRAINT blocks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar as políticas RLS para garantir que funcionem corretamente
DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can insert their own blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can update their own blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.blocks;

-- Recriar as políticas RLS
CREATE POLICY "Users can view their own blocks" 
  ON public.blocks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blocks" 
  ON public.blocks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blocks" 
  ON public.blocks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blocks" 
  ON public.blocks 
  FOR DELETE 
  USING (auth.uid() = user_id);
