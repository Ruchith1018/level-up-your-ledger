-- Add profile_image column to families table
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Create storage bucket for family profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('family_profiles', 'family_profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for family_profiles bucket
-- Allow authenticated users (admins) to upload family profile images
CREATE POLICY "Authenticated users can upload family profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'family_profiles');

-- Allow authenticated users to update/replace family profile images
CREATE POLICY "Authenticated users can update family profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'family_profiles');

-- Allow authenticated users to delete family profile images
CREATE POLICY "Authenticated users can delete family profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'family_profiles');

-- Allow public read access to family profile images
CREATE POLICY "Public can view family profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'family_profiles');

-- Update RLS policy to allow admins to update profile_image
DROP POLICY IF EXISTS "Admins can update their family" ON public.families;
CREATE POLICY "Admins can update their family"
    ON public.families FOR UPDATE
    USING (
        id IN (SELECT get_my_admin_family_ids())
        OR
        created_by = auth.uid()
    )
    WITH CHECK (
        id IN (SELECT get_my_admin_family_ids())
        OR
        created_by = auth.uid()
    );
