-- Add longest_streak column to gamification_profiles table
ALTER TABLE gamification_profiles 
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
