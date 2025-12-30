-- Enable Realtime for Family Tables
-- This ensures that changes to these tables are broadcast to subscribed clients

DO $$
BEGIN
  -- 1. families
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'families') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.families;
  END IF;

  -- 2. family_members
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'family_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.family_members;
  END IF;

  -- 3. family_requests
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'family_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.family_requests;
  END IF;

  -- 4. family_budgets
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'family_budgets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.family_budgets;
  END IF;

  -- 5. family_budget_contributions
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'family_budget_contributions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.family_budget_contributions;
  END IF;

  -- 6. expenses (Crucial for shared budget tracking)
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'expenses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  END IF;

  -- 7. family_budget_surplus (Correct table name for savings)
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'family_budget_surplus') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.family_budget_surplus;
  END IF;

  -- 8. family_spending_limits
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'family_spending_limits') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.family_spending_limits;
  END IF;

END $$;
