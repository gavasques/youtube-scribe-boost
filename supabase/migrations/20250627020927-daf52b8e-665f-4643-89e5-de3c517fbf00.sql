
-- Create RPC function to get quota usage data
CREATE OR REPLACE FUNCTION public.get_quota_usage(p_user_id UUID, p_date DATE)
RETURNS TABLE(
  requests_used INTEGER,
  date DATE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    yqu.requests_used,
    yqu.date,
    yqu.updated_at
  FROM public.youtube_quota_usage yqu
  WHERE yqu.user_id = p_user_id 
    AND yqu.date = p_date;
END;
$$;
