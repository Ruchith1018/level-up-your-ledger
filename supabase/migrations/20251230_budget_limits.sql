
-- Create family_budget_limits table
CREATE TABLE IF NOT EXISTS public.family_budget_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_budget_id UUID REFERENCES public.family_budgets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    limit_amount NUMERIC NOT NULL CHECK (limit_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(family_budget_id, user_id)
);

-- Enable RLS
ALTER TABLE public.family_budget_limits ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. View: Family members can view limits (to see their own and maybe others)
-- We need to check if the user is a member of the family that owns the budget
CREATE POLICY "Family members can view budget limits"
    ON public.family_budget_limits FOR SELECT
    USING (
        family_budget_id IN (
            SELECT id FROM public.family_budgets WHERE family_id IN (SELECT get_my_family_ids())
        )
    );

-- 2. Manage: Only Admins can insert/update/delete limits
CREATE POLICY "Admins can manage budget limits"
    ON public.family_budget_limits FOR ALL
    USING (
        family_budget_id IN (
            SELECT id FROM public.family_budgets WHERE family_id IN (SELECT get_my_admin_family_ids())
        )
    );
