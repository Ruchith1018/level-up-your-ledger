-- 1. Fix Expense Visibility for Family Budgets
-- Allow users to view expenses that belong to a family budget they are part of
CREATE POLICY "Family members can view shared expenses"
  ON public.expenses FOR SELECT
  USING (
    family_budget_id IS NOT NULL AND
    family_budget_id IN (
      SELECT id FROM public.family_budgets
      WHERE family_id IN (
        SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
      )
    )
  );

-- 2. Create Helper for Leader/Admin Permissions
CREATE OR REPLACE FUNCTION public.get_my_leader_family_ids()
RETURNS SETOF uuid AS $$
  SELECT family_id FROM public.family_members
  WHERE user_id = auth.uid() AND role IN ('admin', 'leader');
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Update/Add RLS for Family Requests
-- Allow Leaders and Admins to view requests for their families
CREATE POLICY "Leaders can view family requests"
  ON public.family_requests FOR SELECT
  USING (
    family_id IN (SELECT get_my_leader_family_ids())
  );

-- Ensure users can view their own requests (likely already exists, but ensuring it)
CREATE POLICY "Users can view own requests"
  ON public.family_requests FOR SELECT
  USING (
    user_id = auth.uid()
  );
