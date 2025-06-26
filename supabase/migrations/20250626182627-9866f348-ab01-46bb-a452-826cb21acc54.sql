
-- Criar enum para tipos de tarefas agendadas
CREATE TYPE public.scheduled_task_type AS ENUM (
  'activate_block',
  'deactivate_block', 
  'sync_videos'
);

-- Criar enum para status das tarefas
CREATE TYPE public.scheduled_task_status AS ENUM (
  'pending',
  'running',
  'completed',
  'error'
);

-- Criar tabela para tarefas agendadas
CREATE TABLE public.scheduled_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  task_type scheduled_task_type NOT NULL,
  status scheduled_task_status NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  task_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela scheduled_tasks
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para scheduled_tasks
CREATE POLICY "Users can view their own scheduled tasks" 
  ON public.scheduled_tasks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled tasks" 
  ON public.scheduled_tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled tasks" 
  ON public.scheduled_tasks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled tasks" 
  ON public.scheduled_tasks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_scheduled_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scheduled_tasks_updated_at
  BEFORE UPDATE ON public.scheduled_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scheduled_tasks_updated_at();

-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar função para executar tarefas agendadas
CREATE OR REPLACE FUNCTION public.process_scheduled_tasks()
RETURNS void AS $$
BEGIN
  -- Atualizar tarefas pendentes que chegaram no horário
  UPDATE public.scheduled_tasks
  SET status = 'running'
  WHERE status = 'pending' 
    AND scheduled_for <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
