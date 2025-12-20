import { Expense, Budget } from "@/types";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import dayOfYear from "dayjs/plugin/dayOfYear";
import { CURRENCIES, getCurrencySymbol } from "@/constants/currencies";

dayjs.extend(weekOfYear);
dayjs.extend(dayOfYear);

export interface Task {
    id: string;
    title: string;
    description: string;
    reward: number;
    total: number;
    checkProgress: (transactions: Expense[], budget?: Budget) => number;
}

// Helper to seed random number generator
const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

// Shuffle array with seed
const shuffle = <T>(array: T[], seed: number): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Approximate Exchange Rates (Base: USD)
// These are used for setting "Difficulty Parity" across currencies
const EXCHANGE_RATES: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    INR: 84,   // 1 USD approx 84 INR
    JPY: 150,
    CAD: 1.35,
    AUD: 1.5,
};

const getAdjustedAmount = (baseAmount: number, currencyCode: string): number => {
    const rate = EXCHANGE_RATES[currencyCode] || 1;
    let converted = baseAmount * rate;

    // Round nicely
    if (converted > 1000) {
        // Round to nearest 100
        return Math.round(converted / 100) * 100;
    } else if (converted > 100) {
        // Round to nearest 50
        return Math.round(converted / 50) * 50;
    } else if (converted > 10) {
        // Round to nearest 5
        return Math.round(converted / 5) * 5;
    }
    return Math.round(converted);
};

// --- DAILY TASKS ---
const getDailyPool = (currencyCode: string): Task[] => {
    const symbol = getCurrencySymbol(currencyCode);
    const amount50 = getAdjustedAmount(50, currencyCode);
    const amount100 = getAdjustedAmount(100, currencyCode);

    return [
        {
            id: "daily_log_expense",
            title: "Log an Expense",
            description: "Track at least one expense today",
            reward: 5,
            total: 1,
            checkProgress: (txs) => txs.filter(t => t.type === "expense").length,
        },
        {
            id: "daily_check_in",
            title: "Daily Check-in",
            description: "Open the app and check your progress",
            reward: 5,
            total: 1,
            checkProgress: () => 1,
        },
        {
            id: "daily_smart_spender",
            title: "Smart Spender",
            description: `Log an expense under ${symbol}${amount50}`,
            reward: 10,
            total: 1,
            checkProgress: (txs) => txs.filter(t => t.type === "expense" && t.amount < amount50).length,
        },
        {
            id: "daily_note_taker",
            title: "Note Taker",
            description: "Add a note to a transaction",
            reward: 5,
            total: 1,
            checkProgress: (txs) => txs.filter(t => t.notes && t.notes.length > 0).length,
        },
        {
            id: "daily_foodie",
            title: "Food Tracker",
            description: "Log a Food or Dining expense",
            reward: 10,
            total: 1,
            checkProgress: (txs) => txs.filter(t => {
                if (t.type !== "expense" || !t.category) return false;
                const cat = t.category.toLowerCase();
                return cat.includes("food") || cat.includes("dining") || cat.includes("groceries");
            }).length,
        },
        {
            id: "daily_no_spend_morning",
            title: "No Spend Morning",
            description: "No expenses logged before 12 PM",
            reward: 15,
            total: 1,
            checkProgress: (txs) => {
                const morningExpenses = txs.filter(t => t.type === "expense" && dayjs(t.date).hour() < 12);
                if (dayjs().hour() >= 12 && morningExpenses.length === 0) return 1;
                return 0;
            },
        },
        {
            id: "daily_saver",
            title: "Savings Star",
            description: "Log an income transaction",
            reward: 20,
            total: 1,
            checkProgress: (txs) => txs.filter(t => t.type === "income").length,
        },
        {
            id: "daily_precise",
            title: "Precise Logger",
            description: "Log a transaction with exact cents (e.g. 10.50)",
            reward: 10,
            total: 1,
            checkProgress: (txs) => txs.filter(t => t.amount % 1 !== 0).length,
        },
        {
            id: "daily_big_purchase",
            title: "Big Purchase Tracker",
            description: `Log an expense over ${symbol}${amount100}`,
            reward: 15,
            total: 1,
            checkProgress: (txs) => txs.filter(t => t.type === "expense" && t.amount > amount100).length,
        },
        {
            id: "daily_category_explorer",
            title: "Category Explorer",
            description: "Log transactions in 2 different categories",
            reward: 15,
            total: 2,
            checkProgress: (txs) => new Set(txs.map(t => t.category)).size,
        }
    ];
};

// --- WEEKLY TASKS ---
const getWeeklyPool = (currencyCode: string): Task[] => {
    const symbol = getCurrencySymbol(currencyCode);
    const amount500 = getAdjustedAmount(500, currencyCode);
    const amount20 = getAdjustedAmount(20, currencyCode);

    return [
        {
            id: "weekly_warrior",
            title: "Weekly Warrior",
            description: "Log 10 transactions this week",
            reward: 50,
            total: 10,
            checkProgress: (txs) => txs.length,
        },
        {
            id: "weekly_saver",
            title: "Super Saver",
            description: `Log an income over ${symbol}${amount500}`,
            reward: 100,
            total: 1,
            checkProgress: (txs) => txs.filter(t => t.type === "income" && t.amount > amount500).length,
        },
        {
            id: "weekly_variety",
            title: "Variety Pack",
            description: "Spend in 4 different categories",
            reward: 75,
            total: 4,
            checkProgress: (txs) => new Set(txs.filter(t => t.type === "expense").map(t => t.category)).size,
        },
        {
            id: "weekly_disciplined",
            title: "Disciplined Spender",
            description: `Log 5 expenses under ${symbol}${amount20}`,
            reward: 60,
            total: 5,
            checkProgress: (txs) => txs.filter(t => t.type === "expense" && t.amount < amount20).length,
        },
        {
            id: "weekly_active",
            title: "Active Tracker",
            description: "Log transactions on 3 different days",
            reward: 80,
            total: 3,
            checkProgress: (txs) => new Set(txs.map(t => dayjs(t.date).format("YYYY-MM-DD"))).size,
        },
        {
            id: "weekly_no_spend_streak",
            title: "Mini Streak",
            description: "No expenses for 2 days this week",
            reward: 100,
            total: 1, // Binary completion
            checkProgress: (txs) => {
                return txs.filter(t => t.type === "income").length >= 3 ? 1 : 0;
            }
        },
        {
            id: "weekly_income_boost",
            title: "Income Boost",
            description: "Log 2 income transactions",
            reward: 50,
            total: 2,
            checkProgress: (txs) => txs.filter(t => t.type === "income").length,
        }
    ];
};

// --- MONTHLY TASKS ---
const getMonthlyPool = (currencyCode: string): Task[] => {
    const symbol = getCurrencySymbol(currencyCode);
    const amount2000 = getAdjustedAmount(2000, currencyCode);

    return [
        {
            id: "monthly_master",
            title: "Monthly Master",
            description: "Log 30 transactions this month",
            reward: 200,
            total: 30,
            checkProgress: (txs) => txs.length,
        },
        {
            id: "monthly_category_king",
            title: "Category King",
            description: "Spend in 6 different categories",
            reward: 150,
            total: 6,
            checkProgress: (txs) => new Set(txs.filter(t => t.type === "expense").map(t => t.category)).size,
        },
        {
            id: "monthly_big_saver",
            title: "Big Saver",
            description: `Log total income over ${symbol}${amount2000}`,
            reward: 300,
            total: 2000,
            checkProgress: (txs) => txs.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
        },
        {
            id: "monthly_consistent",
            title: "Consistent Tracker",
            description: "Log transactions on 15 different days",
            reward: 250,
            total: 15,
            checkProgress: (txs) => new Set(txs.map(t => dayjs(t.date).format("YYYY-MM-DD"))).size,
        },
        {
            id: "monthly_dedication",
            title: "Dedication",
            description: "Log 50 expenses",
            reward: 200,
            total: 50,
            checkProgress: (txs) => txs.filter(t => t.type === "expense").length,
        }
    ];
};

export const getDailyTasks = (date: dayjs.Dayjs, currencyCode: string = 'USD'): Task[] => {
    const seed = date.year() * 1000 + date.dayOfYear();
    const dailyPool = getDailyPool(currencyCode);
    // Always include "Log an Expense" as the first task
    const fixedTask = dailyPool[0];
    const pool = dailyPool.slice(1);
    const shuffled = shuffle(pool, seed);
    // Select 4 more tasks to make 5 total
    return [fixedTask, ...shuffled.slice(0, 4)];
};

export const getWeeklyTasks = (date: dayjs.Dayjs, currencyCode: string = 'USD'): Task[] => {
    const seed = date.year() * 100 + date.week();
    const weeklyPool = getWeeklyPool(currencyCode);
    const shuffled = shuffle(weeklyPool, seed);
    // Select 4 tasks
    return shuffled.slice(0, 4);
};

export const getMonthlyTasks = (date: dayjs.Dayjs, currencyCode: string = 'USD'): Task[] => {
    const seed = date.year() * 100 + date.month();
    const monthlyPool = getMonthlyPool(currencyCode);
    const shuffled = shuffle(monthlyPool, seed);
    // Select 3 tasks
    return shuffled.slice(0, 3);
};

