-- Create family_chats table
CREATE TABLE IF NOT EXISTS public.family_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.family_chats ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view chats of their family
CREATE POLICY "Members can view family chats"
    ON public.family_chats
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = family_chats.family_id
            AND family_members.user_id = auth.uid()
        )
    );

-- Policy: Members can send family chats
CREATE POLICY "Members can send family chats"
    ON public.family_chats
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = family_chats.family_id
            AND family_members.user_id = auth.uid()
        )
    );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_chats;
