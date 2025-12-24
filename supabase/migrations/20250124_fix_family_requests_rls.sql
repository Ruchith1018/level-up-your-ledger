-- Fix RLS policy for family_requests to allow both user join requests and system invites
-- The issue: Current policy only allows users to create their own join_request entries
-- But we also need to allow the system (via edge function) to create invite entries

DROP POLICY IF EXISTS "Users create join requests" ON public.family_requests;
CREATE POLICY "Users and system create requests"
    ON public.family_requests FOR INSERT
    WITH CHECK (
        -- Users can create join requests for themselves
        (user_id = auth.uid() AND request_type = 'join_request')
        OR
        -- Service role can create any request type (for invites from edge function)
        (auth.jwt() ->> 'role' = 'service_role')
    );
