
-- Remove columns that have been moved to specialized tables
ALTER TABLE public.videos 
DROP COLUMN IF EXISTS original_description,
DROP COLUMN IF EXISTS current_description,
DROP COLUMN IF EXISTS compiled_description,
DROP COLUMN IF EXISTS original_tags,
DROP COLUMN IF EXISTS current_tags,
DROP COLUMN IF EXISTS ai_generated_tags,
DROP COLUMN IF EXISTS transcription,
DROP COLUMN IF EXISTS ai_summary,
DROP COLUMN IF EXISTS ai_description,
DROP COLUMN IF EXISTS ai_chapters,
DROP COLUMN IF EXISTS configuration_status,
DROP COLUMN IF EXISTS update_status,
DROP COLUMN IF EXISTS views_count,
DROP COLUMN IF EXISTS likes_count,
DROP COLUMN IF EXISTS comments_count,
DROP COLUMN IF EXISTS thumbnail_url,
DROP COLUMN IF EXISTS duration_seconds,
DROP COLUMN IF EXISTS duration_formatted,
DROP COLUMN IF EXISTS privacy_status;

-- Add comment to document the table structure after cleanup
COMMENT ON TABLE public.videos IS 'Core video information table - contains only essential video data. Related data is stored in specialized tables: video_metadata, video_descriptions, video_transcriptions, video_ai_content, video_configuration, video_tags';
