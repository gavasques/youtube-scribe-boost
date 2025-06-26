
-- Primeiro, verificar se RLS está habilitado e criar as políticas necessárias
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

-- Remover a constraint de foreign key problemática se existir
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;

-- Alterar a coluna user_id para não ser nullable (necessário para RLS)
ALTER TABLE public.categories ALTER COLUMN user_id SET NOT NULL;

-- Criar políticas RLS para categorias (sem foreign key constraint para auth.users)
CREATE POLICY "Users can view their own categories" 
  ON public.categories 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" 
  ON public.categories 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
  ON public.categories 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
  ON public.categories 
  FOR DELETE 
  USING (auth.uid() = user_id);
