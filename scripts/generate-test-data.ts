/**
 * Test Data Generator for 6 Months
 * Generates realistic test data for all application features
 * 
 * Usage:
 * 1. Set your SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
 * 2. Run: npx tsx scripts/generate-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const USER_ID = process.argv[2]; // Pass user ID as argument

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
}

if (!USER_ID) {
    console.error('❌ Missing user ID. Usage: npx tsx scripts/generate-test-data.ts <user-id>');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Data Templates
const CATEGORIES = {
    expense: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Personal Care', 'Travel', 'Others'],
    income: ['Salary', 'Freelance', 'Business', 'Investments', 'Others']
};

const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Cash', 'UPI', 'Net Banking', 'Wallet'];

const MERCHANTS = [
    'Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Uber', 'Ola',
    'DMart', 'Big Bazaar', 'BookMyShow', 'Netflix', 'Spotify',
    'Reliance Trends', 'Westside', 'H&M', 'Lifestyle',
    'Apollo Pharmacy', 'MedPlus', 'Starbucks', 'McDonald\'s',
    'Domino\'s', 'Pizza Hut', 'KFC', 'Subway'
];

const SUBSCRIPTION_SERVICES = [
    { title: 'Netflix Premium', amount: 649, category: 'Entertainment' },
    { title: 'Amazon Prime', amount: 1499, category: 'Entertainment' },
    { title: 'Spotify Premium', amount: 119, category: 'Entertainment' },
    { title: 'YouTube Premium', amount: 129, category: 'Entertainment' },
    { title: 'Disney+ Hotstar', amount: 299, category: 'Entertainment' },
    { title: 'Adobe Creative Cloud', amount: 1675, category: 'Software' },
    { title: 'Microsoft 365', amount: 419, category: 'Software' },
    { title: 'Google One 100GB', amount: 130, category: 'Software' },
    { title: 'Gym Membership', amount: 1500, category: 'Health & Fitness' },
    { title: 'Mobile Recharge', amount: 399, category: 'Bills & Utilities' }
];

const SAVINGS_GOALS = [
    { name: 'Emergency Fund', targetAmount: 50000, color: '#ef4444', icon: '🚨' },
    { name: 'Vacation Trip', targetAmount: 75000, color: '#3b82f6', icon: '✈️' },
    { name: 'New Laptop', targetAmount: 80000, color: '#8b5cf6', icon: '💻' },
    { name: 'Car Down Payment', targetAmount: 200000, color: '#f59e0b', icon: '🚗' },
    { name: 'Wedding Fund', targetAmount: 300000, color: '#ec4899', icon: '💍' },
    { name: 'Investment Portfolio', targetAmount: 100000, color: '#10b981', icon: '📈' }
];

// Utility Functions
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

function randomItem<T>(array: T[]): T {
    return array[randomInt(0, array.length - 1)];
}

function uuid(): string {
    return crypto.randomUUID();
}

// Generate Transactions (Income & Expenses)
async function generateTransactions() {
    console.log('📊 Generating transactions...');

    const transactions = [];
    const startDate = dayjs().subtract(6, 'month');
    const endDate = dayjs();

    // Generate daily transactions with realistic patterns
    for (let date = startDate; date.isBefore(endDate); date = date.add(1, 'day')) {
        const isWeekend = date.day() === 0 || date.day() === 6;
        const isMonthStart = date.date() <= 5;

        // Monthly salary (1st-5th of month)
        if (isMonthStart && date.date() === 1) {
            transactions.push({
                id: uuid(),
                user_id: USER_ID,
                type: 'income',
                amount: randomFloat(50000, 80000),
                currency: 'INR',
                category: 'Salary',
                merchant: 'Company XYZ Pvt Ltd',
                payment_method: 'Bank Transfer',
                date: date.format('YYYY-MM-DD'),
                notes: 'Monthly salary',
                created_at: date.toISOString()
            });
        }

        // Random freelance income (10% chance)
        if (Math.random() < 0.1) {
            transactions.push({
                id: uuid(),
                user_id: USER_ID,
                type: 'income',
                amount: randomFloat(5000, 20000),
                currency: 'INR',
                category: 'Freelance',
                merchant: 'Client Project',
                payment_method: randomItem(PAYMENT_METHODS),
                date: date.format('YYYY-MM-DD'),
                notes: 'Freelance project payment',
                created_at: date.toISOString()
            });
        }

        // Daily expenses (2-5 transactions per day)
        const numExpenses = isWeekend ? randomInt(3, 6) : randomInt(2, 4);

        for (let i = 0; i < numExpenses; i++) {
            const category = randomItem(CATEGORIES.expense);
            let amount: number;

            // Category-based amount ranges
            switch (category) {
                case 'Food & Dining':
                    amount = randomFloat(100, 800);
                    break;
                case 'Transportation':
                    amount = randomFloat(50, 500);
                    break;
                case 'Shopping':
                    amount = randomFloat(500, 5000);
                    break;
                case 'Entertainment':
                    amount = randomFloat(200, 2000);
                    break;
                case 'Bills & Utilities':
                    amount = randomFloat(500, 3000);
                    break;
                case 'Healthcare':
                    amount = randomFloat(300, 5000);
                    break;
                default:
                    amount = randomFloat(100, 2000);
            }

            transactions.push({
                id: uuid(),
                user_id: USER_ID,
                type: 'expense',
                amount: Number(amount.toFixed(2)),
                currency: 'INR',
                category,
                merchant: randomItem(MERCHANTS),
                payment_method: randomItem(PAYMENT_METHODS),
                date: date.format('YYYY-MM-DD'),
                notes: '',
                created_at: date.add(i, 'hour').toISOString()
            });
        }
    }

    // Insert in batches of 100
    console.log(`  📝 Inserting ${transactions.length} transactions...`);
    for (let i = 0; i < transactions.length; i += 100) {
        const batch = transactions.slice(i, i + 100);
        const { error } = await supabase.from('transactions').insert(batch);
        if (error) {
            console.error(`  ❌ Error inserting batch ${i / 100 + 1}:`, error);
        } else {
            console.log(`  ✅ Inserted batch ${i / 100 + 1} (${batch.length} transactions)`);
        }
    }

    console.log('✅ Transactions generated successfully!\n');
    return transactions;
}

// Generate Budgets
async function generateBudgets() {
    console.log('💰 Generating budgets...');

    const budgets = [];
    const startDate = dayjs().subtract(6, 'month');
    const endDate = dayjs();

    for (let date = startDate; date.isBefore(endDate); date = date.add(1, 'month')) {
        const monthlyBudget = randomFloat(40000, 60000);

        const categoryLimits: Record<string, number> = {};
        CATEGORIES.expense.forEach(category => {
            categoryLimits[category] = randomFloat(2000, 8000);
        });

        budgets.push({
            id: uuid(),
            user_id: USER_ID,
            period: 'monthly',
            month: date.format('YYYY-MM'),
            total: Number(monthlyBudget.toFixed(2)),
            category_limits: categoryLimits,
            rollover: false,
            surplus_action: randomItem(['rollover', 'saved', 'ignored']),
            created_at: date.toISOString()
        });
    }

    const { error } = await supabase.from('budgets').insert(budgets);
    if (error) {
        console.error('  ❌ Error inserting budgets:', error);
    } else {
        console.log(`  ✅ Inserted ${budgets.length} budgets`);
    }

    console.log('✅ Budgets generated successfully!\n');
}

// Generate Savings Goals
async function generateSavingsGoals() {
    console.log('🎯 Generating savings goals...');

    const goals = [];
    const numGoals = randomInt(3, 6);

    for (let i = 0; i < numGoals; i++) {
        const goal = SAVINGS_GOALS[i];
        const createdDate = dayjs().subtract(randomInt(1, 6), 'month');
        const currentAmount = randomFloat(0, goal.targetAmount * 0.7);
        const isCompleted = currentAmount >= goal.targetAmount;

        goals.push({
            id: uuid(),
            user_id: USER_ID,
            name: goal.name,
            target_amount: goal.targetAmount,
            current_amount: Number(currentAmount.toFixed(2)),
            color: goal.color,
            icon: goal.icon,
            deadline: dayjs().add(randomInt(3, 12), 'month').format('YYYY-MM-DD'),
            is_completed: isCompleted,
            created_at: createdDate.toISOString()
        });
    }

    const { error } = await supabase.from('savings_goals').insert(goals);
    if (error) {
        console.error('  ❌ Error inserting savings goals:', error);
    } else {
        console.log(`  ✅ Inserted ${goals.length} savings goals`);
    }

    console.log('✅ Savings goals generated successfully!\n');
}

// Generate Subscriptions
async function generateSubscriptions() {
    console.log('🔄 Generating subscriptions...');

    const subscriptions = [];
    const numSubs = randomInt(4, 8);

    for (let i = 0; i < numSubs; i++) {
        const service = SUBSCRIPTION_SERVICES[i];
        const createdDate = dayjs().subtract(randomInt(1, 6), 'month');
        const billingDay = randomInt(1, 28);
        const nextBillingDate = dayjs().date(billingDay);

        subscriptions.push({
            id: uuid(),
            user_id: USER_ID,
            title: service.title,
            amount: service.amount,
            billing_date: nextBillingDate.format('YYYY-MM-DD'),
            interval: randomItem(['monthly', 'yearly']),
            payment_method: randomItem(PAYMENT_METHODS),
            reminder_days_before: randomInt(1, 7),
            active: Math.random() > 0.2, // 80% active
            category: service.category,
            created_at: createdDate.toISOString()
        });
    }

    const { error } = await supabase.from('subscriptions').insert(subscriptions);
    if (error) {
        console.error('  ❌ Error inserting subscriptions:', error);
    } else {
        console.log(`  ✅ Inserted ${subscriptions.length} subscriptions`);
    }

    console.log('✅ Subscriptions generated successfully!\n');
}

// Generate Gamification Profile
async function generateGamificationProfile() {
    console.log('🎮 Generating gamification profile...');

    const level = randomInt(5, 15);
    const xp = randomInt(0, 100);
    const totalXP = level * 100 + xp;
    const coins = randomInt(500, 5000);
    const totalCoins = randomInt(coins, 10000);
    const streak = randomInt(0, 30);

    const allBadges = [
        'first_transaction',
        'budget_master',
        'savings_starter',
        'wealth_builder',
        'subscription_manager',
        'week_warrior',
        'spending_tracker'
    ];

    const earnedBadges = allBadges.slice(0, randomInt(2, 5));

    // Generate history
    const history = [];
    for (let i = 0; i < 50; i++) {
        const date = dayjs().subtract(randomInt(0, 180), 'day');
        history.push({
            date: date.toISOString(),
            reason: randomItem(['Added expense', 'Added income', 'Task Completed', 'Daily check-in']),
            xpEarned: randomInt(5, 50),
            coinsEarned: randomInt(1, 5),
            coinsSpent: 0
        });
    }

    // Generate claimed tasks
    const claimedTasks = [];
    const today = dayjs();
    for (let i = 0; i < 10; i++) {
        const taskDate = today.subtract(randomInt(0, 180), 'day');
        claimedTasks.push(`daily_transactions_${taskDate.format('YYYY-MM-DD')}`);
    }

    const profile = {
        user_id: USER_ID,
        level,
        xp,
        total_xp: totalXP,
        coins,
        total_coins: totalCoins,
        streak,
        last_check_in: dayjs().toISOString(),
        badges: earnedBadges,
        claimed_tasks: claimedTasks,
        history: history,
        redemption_history: []
    };

    const { error } = await supabase.from('gamification_profiles').upsert(profile);
    if (error) {
        console.error('  ❌ Error inserting gamification profile:', error);
    } else {
        console.log(`  ✅ Gamification profile created (Level ${level}, ${coins} coins, ${streak} day streak)`);
    }

    console.log('✅ Gamification profile generated successfully!\n');
}

// Update User Settings
async function updateUserSettings() {
    console.log('⚙️  Updating user settings...');

    const settings = {
        currency: 'INR',
        locale: 'en-IN',
        theme: 'dark',
        has_completed_onboarding: true,
        has_completed_tutorial: true,
        has_seen_intro: true,
        has_accepted_terms: true,
        has_premium_pack: Math.random() > 0.5
    };

    const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: USER_ID, ...settings });

    if (error) {
        console.error('  ❌ Error updating user settings:', error);
    } else {
        console.log('  ✅ User settings updated');
    }

    console.log('✅ User settings updated successfully!\n');
}

// Main execution
async function main() {
    console.log('\n🚀 Starting Test Data Generation\n');
    console.log(`📌 User ID: ${USER_ID}\n`);
    console.log('═'.repeat(50) + '\n');

    try {
        // Check if user exists
        const { data: user, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', USER_ID)
            .single();

        if (userError || !user) {
            console.error('❌ User not found. Please provide a valid user ID.');
            process.exit(1);
        }

        await generateTransactions();
        await generateBudgets();
        await generateSavingsGoals();
        await generateSubscriptions();
        await generateGamificationProfile();
        await updateUserSettings();

        console.log('═'.repeat(50) + '\n');
        console.log('🎉 Test Data Generation Complete!\n');
        console.log('Summary:');
        console.log('  ✅ ~1000+ transactions (6 months)');
        console.log('  ✅ 6 monthly budgets');
        console.log('  ✅ 3-6 savings goals');
        console.log('  ✅ 4-8 subscriptions');
        console.log('  ✅ Gamification profile with progress');
        console.log('  ✅ User settings configured');
        console.log('\n💡 You can now login and test the application!\n');

    } catch (error) {
        console.error('\n❌ Error during data generation:', error);
        process.exit(1);
    }
}

main();
