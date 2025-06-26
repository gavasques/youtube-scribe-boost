
-- Primeiro, limpar dados existentes das colunas que serão removidas
UPDATE public.categories SET 
  parent_id = NULL,
  icon = NULL,
  color = NULL;

-- Remover as colunas desnecessárias
ALTER TABLE public.categories 
DROP COLUMN IF EXISTS parent_id,
DROP COLUMN IF EXISTS icon,
DROP COLUMN IF EXISTS color;

-- Remover os índices relacionados às colunas removidas
DROP INDEX IF EXISTS idx_categories_parent_id;

-- Manter apenas os índices necessários
-- idx_categories_user_id e idx_categories_is_active já existem e são úteis

-- Limpar categorias existentes para recomeçar com categorias simples
DELETE FROM public.categories;
