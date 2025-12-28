-- Function to safely delete a family and all related data
-- This is intended to be called by the manage-family edge function (admin context)
-- or by authenticated users if we add RLS checks inside.

CREATE OR REPLACE FUNCTION delete_family_atomic(target_family_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Run as owner to bypass potential RLS issues during cleanup, or we rely on caller. 
-- Using SECURITY DEFINER is safer for cleanup tasks ensuring we don't miss rows due to RLS.
SET search_path = public
AS $$
BEGIN
  -- Delete all requests linked to the family
  DELETE FROM family_requests WHERE family_id = target_family_id;

  -- Delete all members linked to the family
  DELETE FROM family_members WHERE family_id = target_family_id;

  -- Delete the family itself
  DELETE FROM families WHERE id = target_family_id;
END;
$$;
