-- Redefine the function to ensure ALL premium users are returned, using LEFT JOIN and metadata
-- Must DROP first because return type might have changed
DROP FUNCTION IF EXISTS get_premium_users_details();

CREATE OR REPLACE FUNCTION get_premium_users_details()
RETURNS TABLE (
  user_id uuid,
  email text,
  user_name text,
  referral_id text,
  purchased_themes text[],
  purchased_card_themes text[],
  has_premium_pack boolean
) 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email::text, -- Cast to ensure type matching
    COALESCE(us.user_name, au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'Anonymous')::text as user_name,
    COALESCE(au.raw_user_meta_data->>'referral_id', '-')::text as referral_id, -- Use metadata only
    COALESCE(us.purchased_themes, ARRAY[]::text[]) as purchased_themes,
    COALESCE(us.purchased_card_themes, ARRAY[]::text[]) as purchased_card_themes,
    COALESCE(us.has_premium_pack, false) as has_premium_pack
  FROM public.user_settings us
  JOIN auth.users au ON us.user_id = au.id
  -- referral_tracking join removed as it's not needed and caused column errors
  WHERE au.email IS NOT NULL; -- Simple check to ensure valid user row, returns ALL users regardless of premium status
END;
$$ LANGUAGE plpgsql;
