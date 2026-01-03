-- Add banner_image column to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS banner_image TEXT;

-- Add comment to the column
COMMENT ON COLUMN user_settings.banner_image IS 'URL to user banner/cover image stored in Supabase storage';
