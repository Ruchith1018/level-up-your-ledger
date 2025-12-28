
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
        const { email } = await req.json()

        if (!email) {
            throw new Error('Email is required')
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        // Use service role key to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Check public.profiles for the email
        // This assumes profiles are created for every user (which the SQL confirms)
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('email')
            .eq('email', email)
            .single();

        // If query was successful and data found, user exists.
        // .single() returns error if 0 rows (PGRST116) or multiple rows.
        const exists = !!data;

        return new Response(
            JSON.stringify({ exists }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )

    } catch (error) {
        // If error is PGRST116 (0 rows), then user does not exist.
        // Supabase JS throws error for .single() if not found.
        const errorMessage = error?.message || "";
        if (errorMessage.includes("JSON object requested, multiple (or no) rows returned") || error?.code === 'PGRST116') {
            return new Response(
                JSON.stringify({ exists: false }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        }

        return new Response(
            JSON.stringify({ error: errorMessage, exists: false }), // Default to false if error, but return error msg
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        )
    }
})
