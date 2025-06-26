
-- Remover constraints que obrigam blocos MANUAL a ter video_id
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS check_manual_block_has_video_id;
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS check_only_manual_has_video_id;

-- Criar índice único parcial para garantir apenas um bloco MANUAL por usuário
CREATE UNIQUE INDEX IF NOT EXISTS unique_manual_block_per_user 
ON public.blocks (user_id) 
WHERE type = 'MANUAL';

-- Criar função para garantir criação automática do bloco Manual
CREATE OR REPLACE FUNCTION ensure_manual_block_exists(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    manual_block_id UUID;
BEGIN
    -- Verificar se já existe um bloco Manual para o usuário
    SELECT id INTO manual_block_id
    FROM public.blocks
    WHERE user_id = p_user_id AND type = 'MANUAL';
    
    -- Se não existir, criar um
    IF manual_block_id IS NULL THEN
        INSERT INTO public.blocks (
            user_id,
            title,
            content,
            type,
            scope,
            priority,
            is_active,
            video_id
        ) VALUES (
            p_user_id,
            'Descrições dos Vídeos',
            'Placeholder para descrições dos vídeos na compilação final',
            'MANUAL',
            'PERMANENT',
            50, -- Prioridade média para ficar no meio
            true,
            NULL -- Sem video_id específico
        )
        RETURNING id INTO manual_block_id;
    END IF;
    
    RETURN manual_block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
