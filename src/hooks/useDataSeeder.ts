import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import dayjs from "dayjs";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

export function useDataSeeder() {
    const { user } = useAuth();
    const [isSeeding, setIsSeeding] = useState(false);

    const seedData = async () => {
        if (!user) {
            toast.error("You must be logged in to seed data.");
            return;
        }

        try {
            setIsSeeding(true);
            toast.loading("Seeding data... This may take a moment.");

            const today = dayjs();
            const months = 6;
            const expensesPayload = [];
            const budgetsPayload = [];
            const savingsPayload = [];
            const subscriptionsPayload = [];

            const categories = ["Food", "Transport", "Utilities", "Entertainment", "Shopping", "Health"];

            // 1. Generate Expenses & Income
            for (let i = 0; i < months; i++) {
                const monthDate = today.subtract(i, 'month');
                const monthStr = monthDate.format('YYYY-MM');

                // Salary (Income)
                expensesPayload.push({
                    user_id: user.id,
                    amount: 5000,
                    category: "Salary",
                    type: "income",
                    payment_method: "Bank Transfer",
                    date: monthDate.startOf('month').add(1, 'day').toISOString(),
                    notes: "Monthly Salary",
                    currency: "USD" // Default
                });

                // Expenses
                categories.forEach(cat => {
                    const numTx = Math.floor(Math.random() * 5) + 2; // 2-6 transactions
                    for (let j = 0; j < numTx; j++) {
                        expensesPayload.push({
                            user_id: user.id,
                            amount: parseFloat((Math.random() * 150 + 10).toFixed(2)),
                            category: cat,
                            type: "expense",
                            payment_method: "Credit Card",
                            date: monthDate.startOf('month').add(Math.floor(Math.random() * 25) + 1, 'day').toISOString(),
                            notes: `${cat} expense`,
                            currency: "USD"
                        });
                    }
                });

                // Budgets
                budgetsPayload.push({
                    user_id: user.id,
                    month: monthStr,
                    total: 3000,
                    category_limits: {
                        "Food": 600,
                        "Transport": 400,
                        "Utilities": 300,
                        "Entertainment": 300,
                        "Shopping": 500,
                        "Health": 200
                    },
                    surplus_action: "saved"
                });
            }

            // 2. Savings Goals
            savingsPayload.push(
                { user_id: user.id, name: "New Laptop", target_amount: 2500, current_amount: 2000, color: "#3b82f6", icon: "Laptop", is_completed: false, deadline: today.add(3, 'month').format('YYYY-MM-DD') },
                { user_id: user.id, name: "Dream Vacation", target_amount: 8000, current_amount: 1500, color: "#10b981", icon: "Plane", is_completed: false, deadline: today.add(1, 'year').format('YYYY-MM-DD') },
                { user_id: user.id, name: "Emergency Fund", target_amount: 15000, current_amount: 15000, color: "#ef4444", icon: "Shield", is_completed: true, deadline: today.subtract(1, 'month').format('YYYY-MM-DD') }
            );

            // 3. Subscriptions
            subscriptionsPayload.push(
                { user_id: user.id, title: "Netflix Premium", amount: 19.99, interval: "monthly", payment_method: "Credit Card", category: "Entertainment", billing_date: today.add(5, 'day').toISOString(), active: true },
                { user_id: user.id, title: "Spotify Duo", amount: 12.99, interval: "monthly", payment_method: "Credit Card", category: "Entertainment", billing_date: today.add(12, 'day').toISOString(), active: true },
                { user_id: user.id, title: "Gym Membership", amount: 55.00, interval: "monthly", payment_method: "Debit Card", category: "Health", billing_date: today.add(1, 'day').toISOString(), active: true }
            );

            // --- BATCH INSERTS ---
            console.log(`Inserting ${expensesPayload.length} expenses...`);
            const { error: expError } = await supabase.from('expenses').insert(expensesPayload);
            if (expError) throw new Error(`Expenses Error: ${expError.message}`);

            console.log(`Inserting ${budgetsPayload.length} budgets...`);
            const { error: budError } = await supabase.from('budgets').insert(budgetsPayload);
            if (budError) throw new Error(`Budgets Error: ${budError.message}`);

            console.log(`Inserting ${savingsPayload.length} savings...`);
            const { error: savError } = await supabase.from('savings_goals').insert(savingsPayload);
            if (savError) throw new Error(`Savings Error: ${savError.message}`);

            console.log(`Inserting ${subscriptionsPayload.length} subscriptions...`);
            const { error: subError } = await supabase.from('subscriptions').insert(subscriptionsPayload);
            if (subError) throw new Error(`Subscriptions Error: ${subError.message}`);


            // 4. Update Gamification (Coins) & Settings (Purchases)
            console.log("Updating coins and purchases...");

            // Update Gamification Profile
            const { error: gameError } = await supabase
                .from('gamification_profiles')
                .update({
                    coins: 99999999,
                    total_coins: 99999999,
                    level: 50,
                    xp: 50000,
                    total_xp: 50000
                })
                .eq('user_id', user.id);

            if (gameError) throw new Error(`Gamification Error: ${gameError.message}`);

            // Update User Settings (Purchased Items)
            const { error: settingsError } = await supabase
                .from('user_settings')
                .update({
                    purchased_themes: ["midnight", "ocean", "sunset", "forest"], // Example theme IDs
                    purchased_card_themes: ["gold", "platinum", "black", "cyber"] // Example card IDs
                })
                .eq('user_id', user.id);

            if (settingsError) throw new Error(`Settings Error: ${settingsError.message}`);

            toast.dismiss();
            toast.success("Demo data injected successfully! Please refresh.");

            // Force reload to reflect changes globally
            setTimeout(() => window.location.reload(), 1500);

        } catch (error: any) {
            console.error("Seeding failed:", error);
            toast.dismiss();
            toast.error(`Seeding failed: ${error.message}`);
        } finally {
            setIsSeeding(false);
        }
    };

    return { seedData, isSeeding };
}
