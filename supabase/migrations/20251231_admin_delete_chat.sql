-- Add is_deleted column to family_chats
ALTER TABLE public.family_chats ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update their own family chats" ON public.family_chats;

-- Create new comprehensive update policy
CREATE POLICY "Users and admins can update family chats"
    ON public.family_chats
    FOR UPDATE
    USING (
        -- User is the author
        auth.uid() = user_id
        OR
        -- OR User is an admin of the family
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = family_chats.family_id
            AND family_members.user_id = auth.uid()
            AND family_members.role = 'admin'
        )
    )
    WITH CHECK (
        -- Same conditions for the new row state
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = family_chats.family_id
            AND family_members.user_id = auth.uid()
            AND family_members.role = 'admin'
        )
    );
