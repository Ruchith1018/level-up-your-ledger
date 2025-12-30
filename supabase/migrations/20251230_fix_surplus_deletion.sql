-- Fix RLS policies for family_budget_surplus deletion issue

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can delete surplus records" ON public.family_budget_surplus;
DROP POLICY IF EXISTS "Admins can insert surplus records" ON public.family_budget_surplus;

-- 2. Create new robust policies using the Security Definer helper
-- This ensures that Admins and Leaders can manage surplus records for ALL members, 
-- regardless of whether they can 'see' the member record via other RLS (though they should be able to).

CREATE POLICY "Admins and Leaders can delete surplus records"
    ON public.family_budget_surplus FOR DELETE
    USING (
        family_budget_id IN (
            SELECT id FROM public.family_budgets
            WHERE family_id IN (
                SELECT public.get_my_leader_family_ids()
            )
        )
    );

CREATE POLICY "Admins and Leaders can insert surplus records"
    ON public.family_budget_surplus FOR INSERT
    WITH CHECK (
        family_budget_id IN (
            SELECT id FROM public.family_budgets
            WHERE family_id IN (
                SELECT public.get_my_leader_family_ids()
            )
        )
    );
