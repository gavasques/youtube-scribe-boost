
-- Primeiro, vamos inserir o usuário atual na tabela users se ele não existir
INSERT INTO public.users (id, email, first_name, last_name, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'first_name' as first_name,
    au.raw_user_meta_data->>'last_name' as last_name,
    au.created_at,
    NOW()
FROM auth.users au
WHERE au.id = 'b7e6c153-e441-4778-9ec5-eb637c6d8c82'
AND NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Criar função para automaticamente inserir usuários na tabela public.users
-- quando eles se registram via auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.created_at,
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função sempre que um usuário for criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir qualquer usuário existente que ainda não esteja na tabela public.users
INSERT INTO public.users (id, email, first_name, last_name, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'first_name' as first_name,
    au.raw_user_meta_data->>'last_name' as last_name,
    au.created_at,
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);
