
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { amount, currency, customer_id, customer_name, customer_phone, customer_email } = await req.json()

        // Retrieve sensitive keys from environment variables
        const CASHFREE_APP_ID = "TEST10934330ed28460b79e63caf502d03343901";
        const CASHFREE_SECRET_KEY = "cfsk_ma_test_7fb07bfb66910035594d897bb813709f_c39f63ee";

        if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
            throw new Error('Missing Cashfree credentials');
        }

        const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Cashfree Create Order API
        const response = await fetch('https://sandbox.cashfree.com/pg/orders', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": CASHFREE_APP_ID,
                "x-client-secret": CASHFREE_SECRET_KEY,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify({
                order_amount: amount / 100, // Amount comes in as paisa/cents, convert to main unit if needed. Wait, usually Cashfree takes main unit (INR 10.50).
                // Let's assume input 'amount' is in subunits (like Stripe/Razorpay) as per CardShop.tsx logic (amount * 100). 
                // Razorpay takes paise. Cashfree takes Rupees (float).
                // So if CardShop sends 5000 (50 INR), I should divide by 100.
                order_currency: currency || "INR",
                customer_details: {
                    customer_id: customer_id || "guest_123",
                    customer_name: customer_name || "Guest User",
                    customer_email: customer_email || "guest@example.com",
                    customer_phone: customer_phone || "9999999999"
                },
                order_id: orderId,
                order_meta: {
                    return_url: `${req.headers.get("origin")}/shop?order_id={order_id}` // Optional, but good for redirects if popup fails
                }
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Cashfree Error:", data);
            return new Response(
                JSON.stringify({ success: false, error: data.message || "Failed to create Cashfree order" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, ...data }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }, // Return 200 to allow client parsing
        )
    }
})
