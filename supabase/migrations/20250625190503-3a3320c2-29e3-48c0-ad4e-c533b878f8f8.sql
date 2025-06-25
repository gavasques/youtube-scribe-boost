
-- Criar enum para tipos de aprovação
CREATE TYPE approval_type AS ENUM (
  'BLOCK_CHANGE',
  'MASS_UPDATE', 
  'SYNC_OPERATION',
  'CATEGORY_CHANGE',
  'TAG_UPDATE',
  'SEASONAL_TEMPLATE'
);

-- Criar enum para status de aprovação
CREATE TYPE approval_status AS ENUM (
  'PENDING',
  'APPROVED', 
  'REJECTED'
);

-- Criar tabela de aprovações
CREATE TABLE public.approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type approval_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  status approval_status NOT NULL DEFAULT 'PENDING',
  affected_videos_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  approval_reason TEXT,
  rejection_reason TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para aprovações
CREATE POLICY "Users can view their own approvals" 
  ON public.approvals 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own approvals" 
  ON public.approvals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own approvals" 
  ON public.approvals 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own approvals" 
  ON public.approvals 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Índices para melhor performance
CREATE INDEX idx_approvals_user_id ON public.approvals(user_id);
CREATE INDEX idx_approvals_status ON public.approvals(status);
CREATE INDEX idx_approvals_type ON public.approvals(type);
CREATE INDEX idx_approvals_created_at ON public.approvals(created_at DESC);
