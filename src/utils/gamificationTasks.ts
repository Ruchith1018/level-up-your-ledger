import { Expense, Budget } from "@/types";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import dayOfYear from "dayjs/plugin/dayOfYear";

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

// --- DAILY TASKS ---
const DAILY_POOL: Task[] = [
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
        checkProgress: () => 1, // Always completed if viewing
    },
    {
        id: "daily_smart_spender",
        title: "Smart Spender",
        description: "Log an expense under $50",
        reward: 10,
        total: 1,
        checkProgress: (txs) => txs.filter(t => t.type === "expense" && t.amount < 50).length,
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
        checkProgress: (txs) => txs.filter(t => t.type === "expense" && (t.category.toLowerCase().includes("food") || t.category.toLowerCase().includes("dining") || t.category.toLowerCase().includes("groceries"))).length,
    },
    {
        id: "daily_no_spend_morning",
        title: "No Spend Morning",
        description: "No expenses logged before 12 PM",
        reward: 15,
        total: 1,
        checkProgress: (txs) => {
            const morningExpenses = txs.filter(t => t.type === "expense" && dayjs(t.date).hour() < 12);
            // If it's past 12 PM and no morning expenses, complete. 
            // But this is tricky to check "live". Let's simplify: 
            // If current time > 12PM and count is 0, then 1. Else 0.
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
        description: "Log an expense over $100",
        reward: 15,
        total: 1,
        checkProgress: (txs) => txs.filter(t => t.type === "expense" && t.amount > 100).length,
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

// --- WEEKLY TASKS ---
const WEEKLY_POOL: Task[] = [
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
        description: "Log an income over $500",
        reward: 100,
        total: 1,
        checkProgress: (txs) => txs.filter(t => t.type === "income" && t.amount > 500).length,
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
        description: "Log 5 expenses under $20",
        reward: 60,
        total: 5,
        checkProgress: (txs) => txs.filter(t => t.type === "expense" && t.amount < 20).length,
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
            // This is complex to calculate from just a list of transactions without knowing the full date range context easily.
            // Simplified: Check if there are <= 5 days with expenses in the last 7 days? No, that's not accurate.
            // Let's swap this for something easier: "Log 3 Income Transactions"
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

// --- MONTHLY TASKS ---
const MONTHLY_POOL: Task[] = [
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
        description: "Log total income over $2000",
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

export const getDailyTasks = (date: dayjs.Dayjs): Task[] => {
    const seed = date.year() * 1000 + date.dayOfYear();
    // Always include "Log an Expense" as the first task
    const fixedTask = DAILY_POOL[0];
    const pool = DAILY_POOL.slice(1);
    const shuffled = shuffle(pool, seed);
    // Select 4 more tasks to make 5 total
    return [fixedTask, ...shuffled.slice(0, 4)];
};

export const getWeeklyTasks = (date: dayjs.Dayjs): Task[] => {
    const seed = date.year() * 100 + date.week();
    const shuffled = shuffle(WEEKLY_POOL, seed);
    // Select 4 tasks
    return shuffled.slice(0, 4);
};

export const getMonthlyTasks = (date: dayjs.Dayjs): Task[] => {
    const seed = date.year() * 100 + date.month();
    const shuffled = shuffle(MONTHLY_POOL, seed);
    // Select 3 tasks
    return shuffled.slice(0, 3);
};
