-- Migration to update Refund RPC logic
-- Fixes: Uses negative expense amount to correctly reduce spending (increase remaining budget).
-- Removes explicit limit updates to avoid double-counting.
-- Update: Sets category to 'Savings Refund' for better UI distinction.

CREATE OR REPLACE FUNCTION public.distribute_savings_refund(
    p_request_id UUID,
    p_amount_used NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_family_id UUID;
    v_budget_id UUID;
    v_total_collected NUMERIC;
    v_accepted_count INT;
    v_refund_per_member NUMERIC;
    v_currency TEXT;
    v_title TEXT;
    v_member_record RECORD;
BEGIN
    -- 1. Validate Request
    SELECT family_id, title, currency INTO v_family_id, v_title, v_currency
    FROM public.family_savings_requests r
    JOIN public.families f ON f.id = r.family_id
    WHERE r.id = p_request_id;

    IF v_family_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;

    -- 2. Get Active Budget
    SELECT id INTO v_budget_id
    FROM public.family_budgets
    WHERE family_id = v_family_id
    AND status = 'spending';

    IF v_budget_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active spending budget found');
    END IF;

    -- 3. Calculate Refund
    SELECT 
        COUNT(*), 
        COALESCE(SUM(amount_deducted), 0)
    INTO 
        v_accepted_count,
        v_total_collected
    FROM public.family_savings_members
    WHERE savings_request_id = p_request_id
    AND status = 'accepted';

    IF v_accepted_count = 0 THEN
        UPDATE public.family_savings_requests
        SET status = 'completed', amount_used = 0
        WHERE id = p_request_id;
        RETURN jsonb_build_object('success', true, 'message', 'Request closed (no contributors)');
    END IF;

    IF p_amount_used > v_total_collected THEN
         RETURN jsonb_build_object('success', false, 'error', 'Used amount cannot exceed collected amount');
    END IF;

    v_refund_per_member := (v_total_collected - p_amount_used) / v_accepted_count;

    -- 4. Process Refund Loop
    IF v_refund_per_member > 0 THEN
        FOR v_member_record IN 
            SELECT user_id 
            FROM public.family_savings_members 
            WHERE savings_request_id = p_request_id 
            AND status = 'accepted'
        LOOP
            -- Create NEGATIVE Expense Record
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
                v_member_record.user_id,
                v_refund_per_member * -1, -- NEGATIVE AMOUNT
                'Refund: ' || v_title,
                'Savings Refund', -- Distinct Category
                now(),
                'income',
                COALESCE(v_currency, 'INR'),
                'Savings Refund'
            );
        END LOOP;
    END IF;

    -- 5. Update Request Status
    UPDATE public.family_savings_requests
    SET status = 'completed',
        amount_used = p_amount_used
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'refund_amount', v_refund_per_member);
END;
$$;
