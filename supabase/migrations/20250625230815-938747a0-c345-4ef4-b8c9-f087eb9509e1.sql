
-- Create table for secure API key storage
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  service TEXT NOT NULL, -- 'openai', 'bitly', etc
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_validated_at TIMESTAMP WITH TIME ZONE,
  validation_status TEXT DEFAULT 'pending', -- 'pending', 'valid', 'invalid'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service)
);

-- Enable RLS to ensure users can only see their own API keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
CREATE POLICY "Users can view their own API keys" 
  ON public.api_keys 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" 
  ON public.api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
  ON public.api_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
  ON public.api_keys 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_api_keys_updated_at();
