
-- Add is_locked column to expenses table
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Create family_budgets table
CREATE TABLE IF NOT EXISTS public.family_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL, -- Format: 'YYYY-MM'
    total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(family_id, month)
);

-- Create family_budget_contributions table
CREATE TABLE IF NOT EXISTS public.family_budget_contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_budget_id UUID REFERENCES public.family_budgets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    transaction_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL, -- Link to personal expense
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.family_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_budget_contributions ENABLE ROW LEVEL SECURITY;

-- Policies for family_budgets

-- 1. View: Family members (admins/members/viewers) can view budgets for their families
CREATE POLICY "Family members can view budgets"
    ON public.family_budgets FOR SELECT
    USING (
        family_id IN (SELECT get_my_family_ids())
    );

-- 2. Manage: Only Admins can insert/update/delete budgets
CREATE POLICY "Admins can manage budgets"
    ON public.family_budgets FOR ALL
    USING (
        family_id IN (SELECT get_my_admin_family_ids())
    );


-- Policies for family_budget_contributions

-- 1. View: Family members can view contributions
CREATE POLICY "Family members can view contributions"
    ON public.family_budget_contributions FOR SELECT
    USING (
        family_budget_id IN (
            SELECT id FROM public.family_budgets WHERE family_id IN (SELECT get_my_family_ids())
        )
    );

-- 2. Insert: Family members can contribute
CREATE POLICY "Family members can contribute"
    ON public.family_budget_contributions FOR INSERT
    WITH CHECK (
        family_budget_id IN (
            SELECT id FROM public.family_budgets WHERE family_id IN (SELECT get_my_family_ids())
        )
        AND
        user_id = auth.uid()
    );

-- Prevent deletion/update of contributions (Irreversible)
-- We strictly do NOT add policies for UPDATE or DELETE for normal users.
-- Admins might be allowed if needed later, but per requirements "cannot get it back", so we keep it strict.

