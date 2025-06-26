
-- Adicionar coluna para referenciar o vídeo vinculado nos blocos manuais
ALTER TABLE public.blocks ADD COLUMN video_id uuid REFERENCES public.videos(id);

-- Criar índice para melhor performance nas consultas
CREATE INDEX idx_blocks_video_id ON public.blocks(video_id);

-- Adicionar constraint para garantir que blocos MANUAL tenham video_id
ALTER TABLE public.blocks ADD CONSTRAINT check_manual_block_has_video_id 
CHECK (
  (type != 'MANUAL') OR 
  (type = 'MANUAL' AND video_id IS NOT NULL)
);

-- Adicionar constraint para garantir que apenas blocos MANUAL tenham video_id
ALTER TABLE public.blocks ADD CONSTRAINT check_only_manual_has_video_id 
CHECK (
  (type = 'MANUAL' AND video_id IS NOT NULL) OR 
  (type != 'MANUAL' AND video_id IS NULL)
);
