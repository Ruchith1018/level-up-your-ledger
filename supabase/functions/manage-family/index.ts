
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
            // Admin/Leader invites a user by Referral ID
            const { family_id, referral_id } = params

            // 0. Verify Requester Permissions (Admin or Leader)
            const { data: requesterMembership, error: reqMemberError } = await supabaseAdmin
                .from('family_members')
                .select('role')
                .eq('family_id', family_id)
                .eq('user_id', user.id)
                .maybeSingle();

            if (reqMemberError || !requesterMembership || !['admin', 'leader'].includes(requesterMembership.role)) {
                throw new Error('Unauthorized: Only Admins and Leaders can invite members');
            }

            // 1. Find user by unique referral_id
            const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
            if (listError) throw listError;

            const targetUser = usersData.users.find(u => u.user_metadata?.referral_id === referral_id);

            if (!targetUser) throw new Error('User not found with this Referral ID');

            // 2. Check if user is already a member
            const { data: existingMember } = await supabaseAdmin
                .from('family_members')
                .select('user_id')
                .eq('family_id', family_id)
                .eq('user_id', targetUser.id)
                .maybeSingle();

            if (existingMember) {
                throw new Error('User is already a member of this family');
            }

            // 3. Check if an invite already exists
            const { data: existingInvite } = await supabaseAdmin
                .from('family_requests')
                .select('*')
                .eq('family_id', family_id)
                .eq('user_id', targetUser.id)
                .eq('request_type', 'invite')
                .maybeSingle();

            if (existingInvite) {
                // If invite was rejected, update it to pending
                if (existingInvite.status === 'rejected') {
                    const { error: updateError } = await supabaseAdmin
                        .from('family_requests')
                        .update({ status: 'pending' })
                        .eq('id', existingInvite.id);

                    if (updateError) throw updateError;
                    return new Response(JSON.stringify({ success: true, message: 'Invite re-sent successfully' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                // If already pending, just return success
                if (existingInvite.status === 'pending') {
                    return new Response(JSON.stringify({ success: true, message: 'Invite already sent to this user' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }
            }

            // 4. Create new invite
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

            // 5. Check for mutual match: Does user have a pending join_request for this family?
            const { data: matchingJoinRequest } = await supabaseAdmin
                .from('family_requests')
                .select('id')
                .eq('family_id', family_id)
                .eq('user_id', targetUser.id)
                .eq('request_type', 'join_request')
                .eq('status', 'pending')
                .maybeSingle();

            if (matchingJoinRequest) {
                // Mutual match found! Automatically add user to family
                const { error: addError } = await supabaseAdmin
                    .from('family_members')
                    .insert({
                        family_id,
                        user_id: targetUser.id,
                        role: 'member'
                    });

                if (addError) throw addError;

                // Delete both the invite and join request
                const { error: deleteError } = await supabaseAdmin
                    .from('family_requests')
                    .delete()
                    .eq('family_id', family_id)
                    .eq('user_id', targetUser.id);

                if (deleteError) throw deleteError;

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'Mutual match! User automatically added to family',
                        autoAccepted: true
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
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

            // 2. Check if user is already a member
            const { data: existingMember } = await supabaseAdmin
                .from('family_members')
                .select('user_id')
                .eq('family_id', family.id)
                .eq('user_id', user.id)
                .maybeSingle();

            if (existingMember) {
                throw new Error('You are already a member of this family');
            }

            // 3. Check if a join request already exists
            const { data: existingRequest } = await supabaseAdmin
                .from('family_requests')
                .select('*')
                .eq('family_id', family.id)
                .eq('user_id', user.id)
                .eq('request_type', 'join_request')
                .maybeSingle();

            if (existingRequest) {
                // If request was rejected, update it to pending
                if (existingRequest.status === 'rejected') {
                    const { error: updateError } = await supabaseAdmin
                        .from('family_requests')
                        .update({ status: 'pending' })
                        .eq('id', existingRequest.id);

                    if (updateError) throw updateError;
                    return new Response(JSON.stringify({ success: true, message: 'Join request re-sent successfully' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                // If already pending, just return success
                if (existingRequest.status === 'pending') {
                    return new Response(JSON.stringify({ success: true, message: 'Join request already sent' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }
            }

            // 4. Create new join request
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

            // 5. Check for mutual match: Does family have a pending invite for this user?
            const { data: matchingInvite } = await supabaseAdmin
                .from('family_requests')
                .select('id')
                .eq('family_id', family.id)
                .eq('user_id', user.id)
                .eq('request_type', 'invite')
                .eq('status', 'pending')
                .maybeSingle();

            if (matchingInvite) {
                // Mutual match found! Automatically add user to family
                const { error: addError } = await supabaseAdmin
                    .from('family_members')
                    .insert({
                        family_id: family.id,
                        user_id: user.id,
                        role: 'member'
                    });

                if (addError) throw addError;

                // Delete both the join request and invite
                const { error: deleteError } = await supabaseAdmin
                    .from('family_requests')
                    .delete()
                    .eq('family_id', family.id)
                    .eq('user_id', user.id);

                if (deleteError) throw deleteError;

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'Mutual match! You have been automatically added to the family',
                        autoAccepted: true
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
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

            if (memberError || !membership || !['admin', 'leader'].includes(membership.role)) {
                if (request.request_type === 'invite' && request.user_id === user.id) {
                    // Allowed: User accepting invite
                } else {
                    throw new Error('Unauthorized: You must be an Admin or Leader');
                }
            } else {
                if (request.request_type === 'invite') throw new Error('Only the invited user can accept an invite');
            }

            const newStatus = response === 'accept' ? 'approved' : 'rejected';

            // If accepted, add user to family
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

            // Delete the request (whether accepted or rejected)
            const { error: deleteError } = await supabaseAdmin
                .from('family_requests')
                .delete()
                .eq('id', request_id);

            if (deleteError) throw deleteError;

            return new Response(JSON.stringify({ success: true, message: `Request ${newStatus}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

        } else if (action === 'leave') {
            // User leaves their current family

            // 1. Get user's current membership
            const { data: membership, error: memberError } = await supabaseAdmin
                .from('family_members')
                .select('family_id, role')
                .eq('user_id', user.id)
                .maybeSingle();

            if (memberError) throw memberError;
            if (!membership) throw new Error('You are not a member of any family');

            const familyId = membership.family_id;

            // 2. Check if user is an admin
            if (membership.role === 'admin') {
                // Count how many admins are in the family
                const { data: adminCount, error: countError } = await supabaseAdmin
                    .from('family_members')
                    .select('user_id', { count: 'exact', head: true })
                    .eq('family_id', familyId)
                    .eq('role', 'admin');

                if (countError) throw countError;

                // If this is the last admin
                if (adminCount && (adminCount as any).count <= 1) {

                    // Check if there are ANY other members
                    const { count: totalMembers, error: memberCountError } = await supabaseAdmin
                        .from('family_members')
                        .select('*', { count: 'exact', head: true })
                        .eq('family_id', familyId);

                    if (memberCountError) throw memberCountError;

                    console.log(`[Leave] Family: ${familyId}, Total Members: ${totalMembers}`);

                    // If other members exist, require a successor
                    if (totalMembers && totalMembers > 1) {
                        const { successor_id } = params;

                        if (!successor_id) {
                            throw new Error('As the last admin, you must appoint a successor before leaving.');
                        }

                        // Verify successor is a member of this family
                        const { data: successor, error: succError } = await supabaseAdmin
                            .from('family_members')
                            .select('user_id')
                            .eq('family_id', familyId)
                            .eq('user_id', successor_id)
                            .single();

                        if (succError || !successor) {
                            throw new Error('Invalid successor selected.');
                        }

                        // Promote successor
                        const { error: promoteError } = await supabaseAdmin
                            .from('family_members')
                            .update({ role: 'admin' })
                            .eq('family_id', familyId)
                            .eq('user_id', successor_id);

                        if (promoteError) throw promoteError;

                    } else {
                        // NO other members exist. 
                        // We will delete the member, and the database trigger `trg_auto_delete_family` 
                        // will automatically delete the family and requests.
                        console.log(`[Leave] Last member leaving family ${familyId}. Trigger should handle cleanup.`);

                        const { error: deleteMemberError } = await supabaseAdmin
                            .from('family_members')
                            .delete()
                            .eq('family_id', familyId)
                            .eq('user_id', user.id);

                        if (deleteMemberError) {
                            console.error("[Leave] Error deleting member:", deleteMemberError);
                            throw deleteMemberError;
                        }

                        // DOUBLE CHECK: Did the trigger work?
                        const { data: checkData, error: checkError } = await supabaseAdmin
                            .from('families')
                            .select('id')
                            .eq('id', familyId)
                            .maybeSingle();

                        if (checkData) {
                            console.warn("[Leave] WARNING: Family still exists. Trigger might not have fired or failed.");
                            // Fallback: Try explicit delete if trigger failed (redundancy)
                            await supabaseAdmin.rpc('delete_family_atomic', { target_family_id: familyId });
                        } else {
                            console.log("[Leave] Verification successful: Family is gone (handled by trigger).");
                        }

                        return new Response(
                            JSON.stringify({
                                success: true,
                                message: 'You left the family. As the last admin, the family has been deleted.',
                                familyDeleted: true
                            }),
                            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                        );
                    }

                }
            }

            // 3. Remove user from family (if not last admin scenario)
            const { error: leaveError } = await supabaseAdmin
                .from('family_members')
                .delete()
                .eq('family_id', familyId)
                .eq('user_id', user.id);

            if (leaveError) throw leaveError;

            return new Response(
                JSON.stringify({ success: true, message: 'You have left the family successfully' }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        else if (action === 'cancel_request') {
            const { request_id } = params;
            if (!request_id) throw new Error('Missing request_id');

            // 1. Get Request to verify ownership
            const { data: request, error: reqError } = await supabaseAdmin
                .from('family_requests')
                .select('*')
                .eq('id', request_id)
                .single();

            if (reqError || !request) throw new Error('Request not found');

            // 2. Verify Ownership
            if (request.user_id !== user.id) {
                throw new Error('Unauthorized: You can only cancel your own requests');
            }

            // 3. Delete the request
            const { error: deleteError } = await supabaseAdmin
                .from('family_requests')
                .delete()
                .eq('id', request_id);

            if (deleteError) throw deleteError;

            return new Response(JSON.stringify({ success: true, message: 'Request cancelled successfully' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

        } else if (action === 'transfer_admin') {
            const { target_user_id } = params;
            if (!target_user_id) throw new Error('Missing target_user_id');

            if (target_user_id === user.id) throw new Error('Cannot transfer admin rights to yourself');

            // 1. Get Current User Membership (Verify Admin)
            const { data: currentUserMember, error: currMemberError } = await supabaseAdmin
                .from('family_members')
                .select('family_id, role')
                .eq('user_id', user.id)
                .maybeSingle();

            if (currMemberError) throw currMemberError;
            if (!currentUserMember || currentUserMember.role !== 'admin') {
                throw new Error('Unauthorized: You must be an admin to transfer rights');
            }

            const familyId = currentUserMember.family_id;

            // 2. Verify Target User is in the SAME family
            const { data: targetMember, error: targetError } = await supabaseAdmin
                .from('family_members')
                .select('role')
                .eq('family_id', familyId)
                .eq('user_id', target_user_id)
                .maybeSingle();

            if (targetError || !targetMember) {
                throw new Error('Target user is not a member of this family');
            }

            // 3. Perform Role Swap (Sequential updates)
            // A. Demote current admin to member
            const { error: demoteError } = await supabaseAdmin
                .from('family_members')
                .update({ role: 'member' })
                .eq('family_id', familyId)
                .eq('user_id', user.id);

            if (demoteError) throw demoteError;

            // B. Promote target to admin
            const { error: promoteError } = await supabaseAdmin
                .from('family_members')
                .update({ role: 'admin' })
                .eq('family_id', familyId)
                .eq('user_id', target_user_id);

            if (promoteError) {
                // Critical: If promotion fails, try to revert demotion (best effort)
                console.error("Critical: Promotion failed after demotion. Attempting revert.", promoteError);
                await supabaseAdmin
                    .from('family_members')
                    .update({ role: 'admin' })
                    .eq('family_id', familyId)
                    .eq('user_id', user.id);
                throw promoteError;
            }

            return new Response(JSON.stringify({ success: true, message: 'Admin rights transferred successfully' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

        }

        else if (action === 'revert_budget') {
            const { family_budget_id } = params;
            if (!family_budget_id) throw new Error('Missing family_budget_id');

            // 1. Get Budget to find Family ID
            const { data: budget, error: budgetError } = await supabaseAdmin
                .from('family_budgets')
                .select('family_id, month')
                .eq('id', family_budget_id)
                .single();

            if (budgetError || !budget) throw new Error('Budget not found');

            // 2. Verify Permissions (Admin or Leader of that family)
            const { data: membership, error: memberError } = await supabaseAdmin
                .from('family_members')
                .select('role')
                .eq('family_id', budget.family_id)
                .eq('user_id', user.id)
                .maybeSingle();

            if (memberError || !membership || !['admin', 'leader'].includes(membership.role)) {
                throw new Error('Unauthorized: Only Admins and Leaders can revert a budget');
            }

            // 3. Delete Surplus Records (This bypasses RLS, so it works for ALL users)
            const { error: deleteError } = await supabaseAdmin
                .from('family_budget_surplus')
                .delete()
                .eq('family_budget_id', family_budget_id);

            if (deleteError) throw deleteError;

            // 4. Update Budget Status
            const { error: updateError } = await supabaseAdmin
                .from('family_budgets')
                .update({ status: 'spending' })
                .eq('id', family_budget_id);

            if (updateError) throw updateError;

            return new Response(JSON.stringify({ success: true, message: `Budget for ${budget.month} reopened` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

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
