
-- Add status to family_budgets
ALTER TABLE family_budgets 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'collecting' CHECK (status IN ('collecting', 'spending', 'closed'));

-- Create family_spending_limits table
CREATE TABLE IF NOT EXISTS family_spending_limits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    family_budget_id uuid REFERENCES family_budgets(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    limit_amount numeric NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(family_budget_id, user_id)
);

-- Add family_budget_id to expenses
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS family_budget_id uuid REFERENCES family_budgets(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE family_spending_limits ENABLE ROW LEVEL SECURITY;

-- Policies for family_spending_limits
CREATE POLICY "Family members can view spending limits"
    ON family_spending_limits FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.user_id = auth.uid()
            AND fm.family_id = (
                SELECT family_id FROM family_budgets fb WHERE fb.id = family_spending_limits.family_budget_id
            )
        )
    );

CREATE POLICY "Admins can manage spending limits"
    ON family_spending_limits FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.user_id = auth.uid()
            AND fm.role = 'admin'
            AND fm.family_id = (
                SELECT family_id FROM family_budgets fb WHERE fb.id = family_spending_limits.family_budget_id
            )
        )
    );
