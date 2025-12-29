-- Create table to track surplus transferred from family budgets to personal savings
CREATE TABLE IF NOT EXISTS family_budget_surplus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    family_budget_id UUID REFERENCES family_budgets(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    month text NOT NULL, -- Format: YYYY-MM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE family_budget_surplus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own surplus" ON family_budget_surplus;
CREATE POLICY "Users can view their own surplus"
    ON family_budget_surplus FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert surplus records" ON family_budget_surplus;
CREATE POLICY "Admins can insert surplus records"
    ON family_budget_surplus FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM family_members fm
            JOIN family_budgets fb ON fb.family_id = fm.family_id
            WHERE fb.id = family_budget_surplus.family_budget_id
            AND fm.user_id = auth.uid()
            AND fm.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can delete surplus records" ON family_budget_surplus;
CREATE POLICY "Admins can delete surplus records"
    ON family_budget_surplus FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM family_members fm
            JOIN family_budgets fb ON fb.family_id = fm.family_id
            WHERE fb.id = family_budget_surplus.family_budget_id
            AND fm.user_id = auth.uid()
            AND fm.role = 'admin'
        )
    );
