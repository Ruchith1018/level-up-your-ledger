
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
        const { user_id, action, status } = await req.json()

        if (!user_id || !action) {
            throw new Error("Missing required fields");
        }

        // Initialize Supabase Admin Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        let updateData = {};
        if (action === 'toggle_terms') {
            updateData = { has_accepted_terms: status };
        } else if (action === 'toggle_onboarding') {
            updateData = { has_completed_onboarding: status };
        } else {
            throw new Error("Invalid action");
        }

        const { data, error } = await supabaseAdmin
            .from('user_settings')
            .update(updateData)
            .eq('user_id', user_id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            // Check if row exists? 
            // If settings don't exist, we might need to insert? 
            // But usually settings exist for created users.
            throw new Error("User settings not found or update failed");
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
