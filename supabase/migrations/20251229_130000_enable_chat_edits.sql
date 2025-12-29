
-- Enable users to update their own messages
CREATE POLICY "Users can update their own family chats"
    ON public.family_chats
    FOR UPDATE
    USING (
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );
