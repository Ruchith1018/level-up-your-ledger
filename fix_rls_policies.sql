-- =============================================================================
-- RLS POLICIES FIX
-- Enable Row Level Security and add policies for user_settings and gamification_profiles
-- =============================================================================

-- 1. user_settings RLS Policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own settings row
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings" ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own settings
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own settings
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- 2. gamification_profiles RLS Policies
ALTER TABLE public.gamification_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own gamification profile
DROP POLICY IF EXISTS "Users can insert own gamification profile" ON public.gamification_profiles;
CREATE POLICY "Users can insert own gamification profile" ON public.gamification_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own gamification profile
DROP POLICY IF EXISTS "Users can view own gamification profile" ON public.gamification_profiles;
CREATE POLICY "Users can view own gamification profile" ON public.gamification_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own gamification profile
DROP POLICY IF EXISTS "Users can update own gamification profile" ON public.gamification_profiles;
CREATE POLICY "Users can update own gamification profile" ON public.gamification_profiles
FOR UPDATE
USING (auth.uid() = user_id);
