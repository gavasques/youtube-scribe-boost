
-- Inserir categorias iniciais para o usuário autenticado
INSERT INTO public.categories (user_id, name, description, icon, color, parent_id, is_active) VALUES
  (auth.uid(), 'Importação', 'Vídeos sobre importação de produtos', 'package', '#f97316', NULL, true),
  (auth.uid(), 'Internacionalização', 'Expansão internacional de negócios', 'globe', '#22c55e', NULL, true),
  (auth.uid(), 'Amazon', 'Vendas na plataforma Amazon', 'shopping-cart', '#3b82f6', NULL, true),
  (auth.uid(), 'Sem Categoria', 'Vídeos não categorizados', 'folder', '#6b7280', NULL, true);

-- Inserir subcategorias para Amazon
INSERT INTO public.categories (user_id, name, description, icon, color, parent_id, is_active) VALUES
  (auth.uid(), 'FBA', 'Fulfillment by Amazon', 'shopping-cart', '#3b82f6', (SELECT id FROM public.categories WHERE name = 'Amazon' AND user_id = auth.uid()), true),
  (auth.uid(), 'PPC', 'Anúncios pagos Amazon', 'shopping-cart', '#3b82f6', (SELECT id FROM public.categories WHERE name = 'Amazon' AND user_id = auth.uid()), true);

-- Inserir subcategoria para Importação
INSERT INTO public.categories (user_id, name, description, icon, color, parent_id, is_active) VALUES
  (auth.uid(), 'AliExpress', 'Importação via AliExpress', 'package', '#f97316', (SELECT id FROM public.categories WHERE name = 'Importação' AND user_id = auth.uid()), true);
