-- Drop potentially problematic policies
DROP POLICY IF EXISTS "Family members can view budgets" ON public.family_budgets;
DROP POLICY IF EXISTS "Admins can manage budgets" ON public.family_budgets;
DROP POLICY IF EXISTS "Family members can view contributions" ON public.family_budget_contributions;
DROP POLICY IF EXISTS "Family members can contribute" ON public.family_budget_contributions;

-- Re-create with explicit EXISTS clauses (more robust)

-- 1. Budgets View
CREATE POLICY "Family members can view budgets"
    ON public.family_budgets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = public.family_budgets.family_id
            AND family_members.user_id = auth.uid()
        )
    );

-- 2. Budgets Manage (Admin)
CREATE POLICY "Admins can manage budgets"
    ON public.family_budgets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.family_members
            WHERE family_members.family_id = public.family_budgets.family_id
            AND family_members.user_id = auth.uid()
            AND family_members.role = 'admin'
        )
    );

-- 3. Contributions View
CREATE POLICY "Family members can view contributions"
    ON public.family_budget_contributions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.family_budgets
            JOIN public.family_members ON family_members.family_id = family_budgets.family_id
            WHERE family_budgets.id = public.family_budget_contributions.family_budget_id
            AND family_members.user_id = auth.uid()
        )
    );

-- 4. Contributions Insert
CREATE POLICY "Family members can contribute"
    ON public.family_budget_contributions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.family_budgets
            JOIN public.family_members ON family_members.family_id = family_budgets.family_id
            WHERE family_budgets.id = family_budget_id
            AND family_members.user_id = auth.uid()
        )
        AND
        user_id = auth.uid()
    );
