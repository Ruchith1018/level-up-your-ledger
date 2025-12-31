ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS app_font TEXT DEFAULT 'Inter';

COMMENT ON COLUMN user_settings.app_font IS 'Global font family preference for the application.';
