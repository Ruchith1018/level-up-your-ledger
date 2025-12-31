-- Create family_savings_requests table
CREATE TABLE IF NOT EXISTS public.family_savings_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount_per_member NUMERIC NOT NULL CHECK (amount_per_member > 0),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create family_savings_members table to track member responses
CREATE TABLE IF NOT EXISTS public.family_savings_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    savings_request_id UUID REFERENCES public.family_savings_requests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    amount_deducted NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(savings_request_id, user_id)
);

-- Ensure column exists if table was already created
ALTER TABLE public.family_savings_members ADD COLUMN IF NOT EXISTS amount_deducted NUMERIC DEFAULT 0;

-- Enable RLS
ALTER TABLE public.family_savings_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_savings_members ENABLE ROW LEVEL SECURITY;

-- Policies for family_savings_requests

-- View: Family members can view requests for their family
DROP POLICY IF EXISTS "Family members can view savings requests" ON public.family_savings_requests;
CREATE POLICY "Family members can view savings requests"
    ON public.family_savings_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = family_savings_requests.family_id
            AND family_members.user_id = auth.uid()
        )
    );

-- Manage: Only Admins can insert/update/delete requests
DROP POLICY IF EXISTS "Admins can manage savings requests" ON public.family_savings_requests;
CREATE POLICY "Admins can manage savings requests"
    ON public.family_savings_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = family_savings_requests.family_id
            AND family_members.user_id = auth.uid()
            AND family_members.role = 'admin'
        )
    );

-- Policies for family_savings_members

-- View: Family members can view responses (transparency)
DROP POLICY IF EXISTS "Family members can view savings responses" ON public.family_savings_members;
CREATE POLICY "Family members can view savings responses"
    ON public.family_savings_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.family_savings_requests
            JOIN public.family_members ON family_members.family_id = family_savings_requests.family_id
            WHERE family_savings_requests.id = family_savings_members.savings_request_id
            AND family_members.user_id = auth.uid()
        )
    );

-- Update: Users can update their own status (Accept/Reject)
DROP POLICY IF EXISTS "Users can update their own savings status" ON public.family_savings_members;
CREATE POLICY "Users can update their own savings status"
    ON public.family_savings_members FOR UPDATE
    USING (
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Insert: Admins trigger this when creating request
DROP POLICY IF EXISTS "Admins can insert savings members" ON public.family_savings_members;
CREATE POLICY "Admins can insert savings members"
    ON public.family_savings_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_savings_requests
            JOIN public.family_members ON family_members.family_id = family_savings_requests.family_id
            WHERE family_savings_requests.id = family_savings_members.savings_request_id
            AND family_members.user_id = auth.uid()
            AND family_members.role = 'admin'
        )
    );

-- Enable Realtime
-- Use DO block to avoid error if publication already exists or table is already added
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'family_savings_requests') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.family_savings_requests;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'family_savings_members') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.family_savings_members;
    END IF;
END $$;
