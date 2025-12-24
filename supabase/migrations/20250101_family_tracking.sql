-- Create families table
CREATE TABLE IF NOT EXISTS public.families (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    share_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    currency TEXT DEFAULT 'INR'
);

-- Create family_members table
CREATE TABLE IF NOT EXISTS public.family_members (
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'member', 'viewer')) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    allowance NUMERIC DEFAULT 0,
    visibility_level TEXT DEFAULT 'full',
    PRIMARY KEY (family_id, user_id)
);

-- Create family_requests table
CREATE TABLE IF NOT EXISTS public.family_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT CHECK (request_type IN ('invite', 'join_request')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(family_id, user_id, request_type)
);

-- Helper Functions to bypass RLS Recursion
CREATE OR REPLACE FUNCTION get_my_family_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_admin_family_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'admin'
$$;

-- Enable RLS
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_requests ENABLE ROW LEVEL SECURITY;

-- 1. Policies for families
DROP POLICY IF EXISTS "Family members can view their family" ON public.families;
CREATE POLICY "Family members can view their family"
    ON public.families FOR SELECT
    USING (
        id IN (SELECT get_my_family_ids()) 
        OR 
        created_by = auth.uid() -- Allow creators to see their families even before joining
    );

DROP POLICY IF EXISTS "Users can create families" ON public.families;
CREATE POLICY "Users can create families"
    ON public.families FOR INSERT
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can update their family" ON public.families;
CREATE POLICY "Admins can update their family"
    ON public.families FOR UPDATE
    USING (
        id IN (SELECT get_my_admin_family_ids())
        OR
        created_by = auth.uid() -- Allow creators to update initially
    );

-- 2. Policies for family_members
DROP POLICY IF EXISTS "Members can view family members" ON public.family_members;
CREATE POLICY "Members can view family members"
    ON public.family_members FOR SELECT
    USING (family_id IN (SELECT get_my_family_ids()));

DROP POLICY IF EXISTS "Admins can insert members" ON public.family_members;
CREATE POLICY "Admins or Creators can insert members"
    ON public.family_members FOR INSERT
    WITH CHECK (
        family_id IN (SELECT get_my_admin_family_ids())
        OR
        -- Allow the family creator to add themselves (bootstrapping)
        EXISTS (
            SELECT 1 FROM public.families 
            WHERE id = family_id AND created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can update members" ON public.family_members;
CREATE POLICY "Admins can update members"
    ON public.family_members FOR UPDATE
    USING (family_id IN (SELECT get_my_admin_family_ids()));

DROP POLICY IF EXISTS "Admins can delete members" ON public.family_members;
CREATE POLICY "Admins can delete members"
    ON public.family_members FOR DELETE
    USING (family_id IN (SELECT get_my_admin_family_ids()));

-- 3. Policies for family_requests
DROP POLICY IF EXISTS "Users view own requests" ON public.family_requests;
CREATE POLICY "Users view own requests"
    ON public.family_requests FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view requests for their family" ON public.family_requests;
CREATE POLICY "Admins view requests for their family"
    ON public.family_requests FOR SELECT
    USING (family_id IN (SELECT get_my_admin_family_ids()));

DROP POLICY IF EXISTS "Users create join requests" ON public.family_requests;
CREATE POLICY "Users create join requests"
    ON public.family_requests FOR INSERT
    WITH CHECK (user_id = auth.uid() AND request_type = 'join_request');

DROP POLICY IF EXISTS "Admins manage requests" ON public.family_requests;
CREATE POLICY "Admins manage requests"
    ON public.family_requests FOR UPDATE
    USING (family_id IN (SELECT get_my_admin_family_ids()));
