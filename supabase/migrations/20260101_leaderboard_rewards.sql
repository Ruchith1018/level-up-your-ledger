-- Leaderboard Rewards System
-- Creates table to track rewards and RPC function to distribute them

-- 1. Create leaderboard_rewards table
CREATE TABLE IF NOT EXISTS public.leaderboard_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    period_date DATE NOT NULL, -- The date of the period (e.g., 2026-01-01)
    category TEXT NOT NULL CHECK (category IN ('tasks', 'xp')),
    rank INTEGER NOT NULL CHECK (rank IN (1, 2, 3)),
    tokens_awarded INTEGER NOT NULL,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one reward per user per period per category
    UNIQUE(user_id, period_type, period_date, category)
);

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_rewards_user ON leaderboard_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rewards_period ON leaderboard_rewards(period_type, period_date);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rewards_pending ON leaderboard_rewards(period_type, period_date, category);

-- 3. Enable RLS
ALTER TABLE public.leaderboard_rewards ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Users can view own rewards" ON public.leaderboard_rewards;
CREATE POLICY "Users can view own rewards"
    ON public.leaderboard_rewards FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all rewards" ON public.leaderboard_rewards;
CREATE POLICY "Users can view all rewards"
    ON public.leaderboard_rewards FOR SELECT
    USING (true); -- Allow viewing leaderboard

-- 5. RPC Function to process leaderboard rewards
CREATE OR REPLACE FUNCTION process_leaderboard_rewards(
    p_period_type TEXT,
    p_period_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_rewards_given INT := 0;
    v_user_record RECORD;
    v_rank INT;
    v_tokens INT;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Check if rewards already processed for this period
    IF EXISTS (
        SELECT 1 FROM leaderboard_rewards 
        WHERE period_type = p_period_type 
        AND period_date = p_period_date
        LIMIT 1
    ) THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Rewards already processed for this period',
            'rewards_given', 0
        );
    END IF;

    -- Calculate date range based on period type
    IF p_period_type = 'daily' THEN
        v_start_date := p_period_date;
        v_end_date := p_period_date;
    ELSIF p_period_type = 'weekly' THEN
        v_start_date := p_period_date - EXTRACT(DOW FROM p_period_date)::INT;
        v_end_date := v_start_date + 6;
    ELSIF p_period_type = 'monthly' THEN
        v_start_date := DATE_TRUNC('month', p_period_date);
        v_end_date := (DATE_TRUNC('month', p_period_date) + INTERVAL '1 month - 1 day')::DATE;
    ELSIF p_period_type = 'yearly' THEN
        v_start_date := DATE_TRUNC('year', p_period_date);
        v_end_date := (DATE_TRUNC('year', p_period_date) + INTERVAL '1 year - 1 day')::DATE;
    END IF;

    -- Process TASKS category
    v_rank := 0;
    FOR v_user_record IN (
        SELECT 
            gp.user_id,
            COALESCE(
                jsonb_array_length(
                    CASE 
                        WHEN jsonb_typeof(gp.history) = 'array' THEN
                            (SELECT jsonb_agg(h) 
                             FROM jsonb_array_elements(gp.history) h
                             WHERE (h->>'date')::DATE BETWEEN v_start_date AND v_end_date)
                        ELSE '[]'::jsonb
                    END
                ), 0
            ) as task_count
        FROM gamification_profiles gp
        ORDER BY task_count DESC
        LIMIT 3
    ) LOOP
        v_rank := v_rank + 1;
        
        -- Determine tokens based on rank and period
        v_tokens := CASE 
            WHEN p_period_type = 'daily' THEN CASE v_rank WHEN 1 THEN 500 WHEN 2 THEN 250 ELSE 100 END
            WHEN p_period_type = 'weekly' THEN CASE v_rank WHEN 1 THEN 3000 WHEN 2 THEN 2000 ELSE 1000 END
            WHEN p_period_type = 'monthly' THEN CASE v_rank WHEN 1 THEN 10000 WHEN 2 THEN 7000 ELSE 5000 END
            WHEN p_period_type = 'yearly' THEN CASE v_rank WHEN 1 THEN 50000 WHEN 2 THEN 30000 ELSE 25000 END
        END;

        -- Skip if task_count is 0
        IF v_user_record.task_count > 0 THEN
            -- Insert reward record
            INSERT INTO leaderboard_rewards (user_id, period_type, period_date, category, rank, tokens_awarded)
            VALUES (v_user_record.user_id, p_period_type, p_period_date, 'tasks', v_rank, v_tokens)
            ON CONFLICT (user_id, period_type, period_date, category) DO NOTHING;

            -- Award tokens to user
            UPDATE gamification_profiles
            SET coins = COALESCE(coins, 0) + v_tokens
            WHERE user_id = v_user_record.user_id;

            v_rewards_given := v_rewards_given + 1;
        END IF;
    END LOOP;

    -- Process XP category
    v_rank := 0;
    FOR v_user_record IN (
        SELECT 
            gp.user_id,
            COALESCE(
                (SELECT SUM((h->>'xpEarned')::INT)
                 FROM jsonb_array_elements(gp.history) h
                 WHERE jsonb_typeof(gp.history) = 'array'
                   AND (h->>'date')::DATE BETWEEN v_start_date AND v_end_date
                   AND h->>'xpEarned' IS NOT NULL), 
                0
            ) as total_xp
        FROM gamification_profiles gp
        ORDER BY total_xp DESC
        LIMIT 3
    ) LOOP
        v_rank := v_rank + 1;
        
        -- Determine tokens
        v_tokens := CASE 
            WHEN p_period_type = 'daily' THEN CASE v_rank WHEN 1 THEN 500 WHEN 2 THEN 250 ELSE 100 END
            WHEN p_period_type = 'weekly' THEN CASE v_rank WHEN 1 THEN 3000 WHEN 2 THEN 2000 ELSE 1000 END
            WHEN p_period_type = 'monthly' THEN CASE v_rank WHEN 1 THEN 10000 WHEN 2 THEN 7000 ELSE 5000 END
            WHEN p_period_type = 'yearly' THEN CASE v_rank WHEN 1 THEN 50000 WHEN 2 THEN 30000 ELSE 25000 END
        END;

        -- Skip if xp is 0
        IF v_user_record.total_xp > 0 THEN
            -- Insert reward record
            INSERT INTO leaderboard_rewards (user_id, period_type, period_date, category, rank, tokens_awarded)
            VALUES (v_user_record.user_id, p_period_type, p_period_date, 'xp', v_rank, v_tokens)
            ON CONFLICT (user_id, period_type, period_date, category) DO NOTHING;

            -- Award tokens to user
            UPDATE gamification_profiles
            SET coins = COALESCE(coins, 0) + v_tokens
            WHERE user_id = v_user_record.user_id;

            v_rewards_given := v_rewards_given + 1;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'message', 'Rewards processed successfully',
        'rewards_given', v_rewards_given,
        'period_type', p_period_type,
        'period_date', p_period_date
    );
END;
$$;
