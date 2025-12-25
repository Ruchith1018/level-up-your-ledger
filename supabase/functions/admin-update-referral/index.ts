
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email, status, type } = await req.json()

        // Initialize Supabase Admin Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        let updateData = {};
        if (type === 'approve') {
            updateData = { referral_status: 1 };
        } else if (type === 'revert') {
            updateData = { referral_status: 0 };
        } else if (type === 'toggle_claim') {
            updateData = { claimed: status }; // status here expects the NEW boolean value
        } else {
            throw new Error("Invalid action type");
        }

        const { data, error } = await supabaseAdmin
            .from('referral_tracking')
            .update(updateData)
            .eq('email', email)
            .select();

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            // If email match fails, try with case-insensitive
            const { data: retryData, error: retryError } = await supabaseAdmin
                .from('referral_tracking')
                .update(updateData)
                .ilike('email', email)
                .select();

            if (retryError) throw retryError;

            if (!retryData || retryData.length === 0) {
                throw new Error("Referral not found (checked case-insensitive)");
            }
            return new Response(
                JSON.stringify({ success: true, data: retryData }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        }

        return new Response(
            JSON.stringify({ success: true, data: data }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        )
    }
})
