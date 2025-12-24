
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Read body first to check for fallback token
        const body = await req.json();
        const { action, access_token: bodyToken, ...params } = body;

        let authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!authToken && bodyToken) {
            authToken = bodyToken;
        }

        if (!authToken) {
            throw new Error('Missing Access Token (checked Header and Body)');
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Validate User by passing token directly
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authToken)
        if (authError || !user) {
            console.error('Auth Error Details:', authError);
            throw new Error(`Unauthorized (Token: ${authToken.substring(0, 10)}...): ${authError?.message || 'User not found in session'}`);
        }

        if (action === 'invite') {
            // Admin invites a user by Referral ID
            const { family_id, referral_id } = params

            // 1. Find user by unique referral_id
            const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
            if (listError) throw listError;

            const targetUser = usersData.users.find(u => u.user_metadata?.referral_id === referral_id);

            if (!targetUser) throw new Error('User not found with this Referral ID');

            // 2. Create Invite Request
            const { error: inviteError } = await supabaseAdmin
                .from('family_requests')
                .insert({
                    family_id,
                    user_id: targetUser.id,
                    request_type: 'invite',
                    status: 'pending'
                });

            if (inviteError) {
                console.error('Invite Error:', inviteError);
                throw new Error(`Failed to send invite: ${inviteError.message}`);
            }

            return new Response(JSON.stringify({ success: true, message: 'Invite sent' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

        } else if (action === 'join') {
            // User requests to join via Share Code
            const { share_code } = params

            // 1. Find family (Admin privilege needed to search by share_code efficiently or if RLS hides it)
            const { data: family, error: familyError } = await supabaseAdmin
                .from('families')
                .select('id')
                .eq('share_code', share_code)
                .single();

            if (familyError || !family) throw new Error('Invalid Share Code');

            // 2. Create Join Request
            // Use admin client since we've already validated the user
            const { error: joinError } = await supabaseAdmin
                .from('family_requests')
                .insert({
                    family_id: family.id,
                    user_id: user.id,
                    request_type: 'join_request',
                    status: 'pending'
                });

            if (joinError) {
                console.error('Join Error:', joinError);
                throw new Error(`Failed to join: ${joinError.message}`);
            }

            return new Response(JSON.stringify({ success: true, message: 'Join request sent' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

        } else if (action === 'respond') {
            const { request_id, response } = params
            if (!['accept', 'reject'].includes(response)) throw new Error('Invalid response action');

            // 1. Get Request
            const { data: request, error: reqError } = await supabaseAdmin
                .from('family_requests')
                .select('*')
                .eq('id', request_id)
                .single();

            if (reqError || !request) throw new Error('Request not found');

            // 2. Verify Admin permissions
            const { data: membership, error: memberError } = await supabaseAdmin
                .from('family_members')
                .select('role')
                .eq('family_id', request.family_id)
                .eq('user_id', user.id)
                .maybeSingle();

            if (memberError || membership?.role !== 'admin') {
                if (request.request_type === 'invite' && request.user_id === user.id) {
                    // Allowed: User accepting invite
                } else {
                    throw new Error('Unauthorized: You are not an admin');
                }
            } else {
                if (request.request_type === 'invite') throw new Error('Only the invited user can accept an invite');
            }

            const newStatus = response === 'accept' ? 'approved' : 'rejected';

            const { error: updateError } = await supabaseAdmin
                .from('family_requests')
                .update({ status: newStatus })
                .eq('id', request_id);

            if (updateError) throw updateError;

            if (newStatus === 'approved') {
                const { error: addError } = await supabaseAdmin
                    .from('family_members')
                    .insert({
                        family_id: request.family_id,
                        user_id: request.user_id,
                        role: 'member'
                    });
                if (addError) throw addError;
            }

            return new Response(JSON.stringify({ success: true, message: `Request ${newStatus}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        throw new Error('Invalid Action');

    } catch (error: any) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
