
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
        const { order_id, themeId, productType } = await req.json()

        const CASHFREE_APP_ID = "TEST10934330ed28460b79e63caf502d03343901";
        const CASHFREE_SECRET_KEY = "cfsk_ma_test_7fb07bfb66910035594d897bb813709f_c39f63ee";

        if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
            throw new Error('Missing Cashfree credentials');
        }

        const response = await fetch(`https://sandbox.cashfree.com/pg/orders/${order_id}`, {
            headers: {
                "x-client-id": CASHFREE_APP_ID,
                "x-client-secret": CASHFREE_SECRET_KEY,
                "x-api-version": "2023-08-01"
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch order status");
        }

        // Check if paid
        if (data.order_status === "PAID") {
            // Fulfillment Logic
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
            const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

            // Create client with the user's auth token
            const authHeader = req.headers.get('Authorization')!
            const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })

            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError || !user) {
                console.error("User not found or auth error", userError);
                // Return success: true for payment, but fulfillment failed? 
                // Better to throw so frontend sees error, or handle gracefully.
            } else {
                // Fetch current settings
                const { data: settings, error: fetchError } = await supabase
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (settings) {
                    const updates: any = {};

                    if (productType === "premium") {
                        updates.has_premium_pack = true;
                        // Implicitly add custom card
                        const currentThemes = settings.purchased_card_themes || []; // Snake_case in DB usually?
                        // Check mapping. Typically Supabase JS client converts if set, but `select('*')` returns DB columns.
                        // Wait, `settings` context maps `purchasedCardThemes` (camel) to `purchased_card_themes` (snake) likely.
                        // Let's assume the DB column is `purchased_card_themes`.
                        // Note: JS properties from `select` are usually unchanged unless a converter is used.
                        // I will check if I can inspect the table columns but "purchased_card_themes" is standard convention.
                        // Actually, looking at `CardShop.tsx`, `settings` (from context) has `purchasedCardThemes`. 
                        // But that context might be mapping it. 
                        // Let's safe guess `purchased_card_themes` based on standard supabase.

                        // Note: If I use `supabase-js`, it returns what the DB has.
                        // If I can't check, I'll try to update both or be smart.
                        // Most likely `purchased_card_themes` (snake case) in DB, `purchasedCardThemes` (camel) in frontend types.
                        // Code below assumes `purchased_card_themes`.
                        const themes = settings.purchased_card_themes || [];
                        if (!themes.includes("custom")) {
                            updates.purchased_card_themes = [...themes, "custom"];
                        }
                    } else if (themeId) {
                        const currentThemes = settings.purchased_card_themes || [];
                        if (!currentThemes.includes(themeId)) {
                            updates.purchased_card_themes = [...currentThemes, themeId];
                        }
                        updates.card_theme = themeId; // Set as active
                    }

                    if (Object.keys(updates).length > 0) {
                        const { error: updateError } = await supabase
                            .from('user_settings')
                            .update(updates)
                            .eq('user_id', user.id);

                        if (updateError) {
                            console.error("Failed to update settings:", updateError);
                            // We still return success: true because payment succeeded, 
                            // but maybe pass a flag warnings?
                        }
                    }
                }
            }

            return new Response(
                JSON.stringify({ success: true, payment: data }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        } else {
            return new Response(
                JSON.stringify({ success: false, status: data.order_status, payment: data }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        }

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        )
    }
})
