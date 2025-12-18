import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function DataMigration() {
    const { user } = useAuth();
    const migratingRef = useRef(false);

    useEffect(() => {
        if (!user || migratingRef.current) return;

        const checkAndMigrate = async () => {
            const migrationKey = `supabase_migration_completed_${user.id}`;
            const isMigrated = localStorage.getItem(migrationKey);

            if (isMigrated === 'true') return;

            migratingRef.current = true;

            try {
                // Check if DB is already populated (to avoid double migration if localstorage flag was cleared)
                const { count } = await supabase
                    .from('expenses')
                    .select('*', { count: 'exact', head: true });

                if (count && count > 0) {
                    // DB already has data, assume migration done or not needed
                    localStorage.setItem(migrationKey, 'true');
                    return;
                }

                // Check if there is anything to migrate in LocalStorage
                const localExpenses = localStorage.getItem("gft_expenses_v1");
                const localBudgets = localStorage.getItem("gft_budgets_v1");
                const localSavings = localStorage.getItem("gft_savings_goals_v1");
                const localSubs = localStorage.getItem("gft_subscriptions_v1");
                const localGamify = localStorage.getItem("gft_gamify_v1");
                const localSettings = localStorage.getItem("gft_settings_v1");

                let hasData = false;

                if (localExpenses) {
                    const parsed = JSON.parse(localExpenses);
                    if (parsed.items && parsed.items.length > 0) hasData = true;
                }
                if (localBudgets && !hasData) {
                    const parsed = JSON.parse(localBudgets);
                    if (parsed.budgets && parsed.budgets.length > 0) hasData = true;
                }
                if (localSavings && !hasData) {
                    const parsed = JSON.parse(localSavings);
                    if (parsed.goals && parsed.goals.length > 0) hasData = true;
                }
                if (localSubs && !hasData) {
                    const parsed = JSON.parse(localSubs);
                    if (parsed.subscriptions && parsed.subscriptions.length > 0) hasData = true;
                }
                // Gamification and Settings might exist as defaults, so we only migrate if they seem "used"
                // or just migrate them if other data exists. checking "used" is hard.
                // However, for a brand new user, these keys should NOT exist in localStorage anymore
                // because we switched providers to Supabase.
                // If they exist, it's likely an old user.
                if (localGamify && !hasData) hasData = true;
                if (localSettings && !hasData) hasData = true;

                if (!hasData) {
                    // No local data found to migrate.
                    console.log("No local data found to migrate.");
                    localStorage.setItem(migrationKey, 'true');
                    return;
                }

                console.log("Starting data migration...");
                const toastId = toast.loading("Migrating your data to the cloud...");

                // 1. Expenses
                if (localExpenses) {
                    const parsed = JSON.parse(localExpenses);
                    if (parsed.items && parsed.items.length > 0) {
                        const expensesToInsert = parsed.items.map((e: any) => ({
                            user_id: user.id,
                            type: e.type,
                            amount: e.amount,
                            currency: e.currency || "USD",
                            category: e.category,
                            merchant: e.merchant,
                            payment_method: e.paymentMethod,
                            date: e.date,
                            notes: e.notes,
                            created_at: e.createdAt || new Date().toISOString()
                        }));
                        const { error } = await supabase.from('expenses').insert(expensesToInsert);
                        if (error) console.error("Expense migration error:", error);
                    }
                }

                // 2. Budgets
                if (localBudgets) {
                    const parsed = JSON.parse(localBudgets);
                    if (parsed.budgets && parsed.budgets.length > 0) {
                        const budgetsToInsert = parsed.budgets.map((b: any) => ({
                            user_id: user.id,
                            period: b.period,
                            month: b.month,
                            total: b.total,
                            category_limits: b.categoryLimits,
                            surplus_action: b.surplusAction,
                            created_at: b.createdAt || new Date().toISOString()
                        }));
                        const { error } = await supabase.from('budgets').insert(budgetsToInsert);
                        if (error) console.error("Budget migration error:", error);
                    }
                }

                // 3. Savings
                if (localSavings) {
                    const parsed = JSON.parse(localSavings);
                    if (parsed.goals && parsed.goals.length > 0) {
                        const savingsToInsert = parsed.goals.map((g: any) => ({
                            user_id: user.id,
                            name: g.name,
                            target_amount: g.targetAmount,
                            current_amount: g.currentAmount,
                            color: g.color,
                            icon: g.icon,
                            deadline: g.deadline,
                            is_completed: g.isCompleted || false,
                            created_at: g.createdAt || new Date().toISOString()
                        }));
                        const { error } = await supabase.from('savings_goals').insert(savingsToInsert);
                        if (error) console.error("Savings migration error:", error);
                    }
                }

                // 4. Subscriptions
                if (localSubs) {
                    const parsed = JSON.parse(localSubs);
                    if (parsed.subscriptions && parsed.subscriptions.length > 0) {
                        const subsToInsert = parsed.subscriptions.map((s: any) => ({
                            user_id: user.id,
                            title: s.title,
                            amount: s.amount,
                            billing_date: s.billingDate,
                            interval: s.interval,
                            payment_method: s.paymentMethod,
                            reminder_days_before: s.reminderDaysBefore,
                            active: s.active,
                            category: s.category,
                            created_at: s.createdAt || new Date().toISOString(),
                            last_paid_date: s.lastPaidDate,
                            last_payment_transaction_id: s.lastPaymentTransactionId
                        }));
                        const { error } = await supabase.from('subscriptions').insert(subsToInsert);
                        if (error) console.error("Subscription migration error:", error);
                    }
                }

                // 5. Gamification
                if (localGamify) {
                    const parsed = JSON.parse(localGamify);
                    // We update the existing profile because GamificationProvider might have already created a default one
                    const profileUpdates = {
                        level: parsed.level || 1,
                        xp: parsed.xp || 0,
                        total_xp: parsed.totalXP || 0,
                        coins: parsed.coins || 0,
                        total_coins: parsed.totalCoins || 0,
                        streak: parsed.streak || 0,
                        last_check_in: parsed.lastCheckIn,
                        badges: parsed.badges || [],
                        claimed_tasks: parsed.claimedTasks || [],
                        history: parsed.history || [],
                        redemption_history: parsed.redemptionHistory || []
                    };

                    // Check if profile exists first (it should from the Context)
                    // We can upsert
                    const { error } = await supabase.from('gamification_profiles').upsert({
                        user_id: user.id,
                        ...profileUpdates
                    });
                    if (error) console.error("Gamification migration error:", error);
                }

                // 6. Settings
                if (localSettings) {
                    const parsed = JSON.parse(localSettings);
                    const settingsUpdates = {
                        currency: parsed.currency,
                        locale: parsed.locale,
                        theme: parsed.theme,
                        card_theme: parsed.cardTheme,
                        categories: parsed.categories,
                        payment_methods: parsed.paymentMethods,
                        premium_theme: parsed.premiumTheme,
                        user_name: parsed.userName,
                        has_completed_onboarding: parsed.hasCompletedOnboarding,
                        has_completed_tutorial: parsed.hasCompletedTutorial,
                        has_seen_intro: parsed.hasSeenIntro
                    };
                    const { error } = await supabase.from('user_settings').upsert({
                        user_id: user.id,
                        ...settingsUpdates
                    });
                    if (error) console.error("Settings migration error:", error);
                }

                localStorage.setItem(migrationKey, 'true');
                toast.dismiss(toastId);
                toast.success("All data migrated to the cloud successfully!");

            } catch (error) {
                console.error("Migration fatal error:", error);
                toast.error("Migration failed. Please check console.");
            } finally {
                migratingRef.current = false;
            }
        };

        checkAndMigrate();
    }, [user]);

    return null;
}
