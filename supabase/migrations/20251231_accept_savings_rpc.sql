-- Create RPC to securely handle savings acceptance
-- This function will:
-- 1. Check if the user has already responded.
-- 2. Create an expense record for the deduction (This consumes the limit naturally).
-- 3. Update the member's status in family_savings_members.

-- NOTE: We do NOT explicitly deduct 'limit_amount' because creating an expense 
-- already reduces the 'remaining' budget (Limit - Spent). Doing both would double-count.

CREATE OR REPLACE FUNCTION public.accept_family_savings_request(
    p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_family_id UUID;
    v_amount NUMERIC;
    v_title TEXT;
    v_budget_id UUID;
    v_member_record_id UUID;
    v_existing_status TEXT;
    v_currency TEXT;
BEGIN
    v_user_id := auth.uid();

    -- 1. Get Request Details
    SELECT 
        fsr.family_id, 
        fsr.amount_per_member, 
        fsr.title,
        fsm.id,
        fsm.status,
        f.currency
    INTO 
        v_family_id, 
        v_amount, 
        v_title,
        v_member_record_id,
        v_existing_status,
        v_currency
    FROM public.family_savings_requests fsr
    JOIN public.family_savings_members fsm ON fsr.id = fsm.savings_request_id
    JOIN public.families f ON fsr.family_id = f.id
    WHERE fsr.id = p_request_id 
    AND fsm.user_id = v_user_id;

    IF v_member_record_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found or user not a member');
    END IF;

    IF v_existing_status = 'accepted' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already accepted');
    END IF;

    -- 2. Get Active Budget
    SELECT id INTO v_budget_id
    FROM public.family_budgets
    WHERE family_id = v_family_id
    AND status = 'spending';

    IF v_budget_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active spending budget found');
    END IF;

    -- 3. Create Expense Record
    -- This increases 'Total Spent', thereby reducing 'Remaining Limit'.
    INSERT INTO public.expenses (
        family_budget_id,
        user_id,
        amount,
        notes,
        category,
        date,
        type,
        currency,
        payment_method
    ) VALUES (
        v_budget_id,
        v_user_id,
        v_amount,
        'Savings: ' || v_title,
        'Savings',
        now(),
        'expense',
        COALESCE(v_currency, 'INR'),
        'Savings Fund'
    );

    -- 4. Update Member Status
    UPDATE public.family_savings_members
    SET status = 'accepted',
        amount_deducted = v_amount,
        updated_at = now()
    WHERE id = v_member_record_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
