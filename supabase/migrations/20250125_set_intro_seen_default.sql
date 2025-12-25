-- Set default value for has_seen_intro to true
ALTER TABLE user_settings ALTER COLUMN has_seen_intro SET DEFAULT true;

-- Optional: Update existing users who have it as null or false (if desired, but usually safer to just handle new ones)
-- UPDATE user_settings SET has_seen_intro = true WHERE has_seen_intro IS FALSE OR has_seen_intro IS NULL;
