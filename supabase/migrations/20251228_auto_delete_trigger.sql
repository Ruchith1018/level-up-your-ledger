-- Trigger to automatically delete a family when the last member is removed/leaves

CREATE OR REPLACE FUNCTION public.auto_delete_empty_family()
RETURNS TRIGGER AS $$
BEGIN
  -- Log context if needed (for debugging, though logs in triggers can be tricky)
  
  -- Check if there are any members left in the family of the deleted member
  IF NOT EXISTS (
    SELECT 1 FROM public.family_members WHERE family_id = OLD.family_id
  ) THEN
    -- No members left, delete the family
    -- Note: This relies on family_requests having ON DELETE CASCADE. 
    -- If not, we should delete them here too:
    DELETE FROM public.family_requests WHERE family_id = OLD.family_id;
    
    DELETE FROM public.families WHERE id = OLD.family_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_delete_family ON public.family_members;
CREATE TRIGGER trg_auto_delete_family
AFTER DELETE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.auto_delete_empty_family();
