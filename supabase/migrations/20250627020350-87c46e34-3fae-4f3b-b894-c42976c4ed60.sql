
-- Create table to track YouTube API quota usage
CREATE TABLE public.youtube_quota_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  requests_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT youtube_quota_usage_user_date_unique UNIQUE (user_id, date)
);

-- Add RLS policies
ALTER TABLE public.youtube_quota_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quota usage" 
  ON public.youtube_quota_usage 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quota usage" 
  ON public.youtube_quota_usage 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quota usage" 
  ON public.youtube_quota_usage 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_youtube_quota_usage_updated_at
    BEFORE UPDATE ON public.youtube_quota_usage
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_youtube_quota_usage_user_date 
  ON public.youtube_quota_usage (user_id, date);
