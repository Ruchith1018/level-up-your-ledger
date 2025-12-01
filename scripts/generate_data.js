import fs from 'fs';
import CryptoJS from 'crypto-js';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';

// Hardcoded key from utils/security.ts
const SECRET_KEY = "finance-quest-secure-export-key-v1";

const encryptData = (data) => {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
};

const generateData = () => {
    const today = dayjs();
    const months = 6;

    const expenses = [];
    const budgets = [];
    const subscriptions = [];
    const savingsGoals = [];
    const history = []; // Gamification history

    // Categories
    const categories = ["Food", "Transport", "Utilities", "Entertainment", "Shopping", "Health"];

    // Generate 6 months of data
    for (let i = 0; i < months; i++) {
        const monthDate = today.subtract(i, 'month');
        const monthStr = monthDate.format('YYYY-MM');

        // Income (Salary)
        expenses.push({
            id: uuid(),
            amount: 5000,
            category: "Salary",
            date: monthDate.startOf('month').add(1, 'day').toISOString(),
            type: "income",
            paymentMethod: "Bank Transfer",
            notes: "Monthly Salary"
        });

        // Monthly Expenses
        categories.forEach(cat => {
            // Random number of transactions per category
            const numTx = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numTx; j++) {
                expenses.push({
                    id: uuid(),
                    amount: parseFloat((Math.random() * 100 + 20).toFixed(2)),
                    category: cat,
                    date: monthDate.startOf('month').add(Math.floor(Math.random() * 25) + 1, 'day').toISOString(),
                    type: "expense",
                    paymentMethod: "Credit Card",
                    notes: `${cat} expense`
                });
            }
        });

        // Budgets
        budgets.push({
            id: uuid(),
            month: monthStr,
            total: 3000, // Total budget
            categoryLimits: {
                "Food": 500,
                "Transport": 300,
                "Utilities": 200,
                "Entertainment": 200,
                "Shopping": 400,
                "Health": 100
            },
            surplusAction: "saved"
        });
    }

    // Subscriptions
    subscriptions.push(
        { id: uuid(), name: "Netflix", amount: 15.99, billingCycle: "monthly", category: "Entertainment", nextBillingDate: today.add(10, 'day').toISOString(), active: true },
        { id: uuid(), name: "Spotify", amount: 9.99, billingCycle: "monthly", category: "Entertainment", nextBillingDate: today.add(5, 'day').toISOString(), active: true },
        { id: uuid(), name: "Gym", amount: 50.00, billingCycle: "monthly", category: "Health", nextBillingDate: today.add(15, 'day').toISOString(), active: true }
    );

    // Savings Goals
    savingsGoals.push(
        {
            id: uuid(),
            name: "New Laptop",
            targetAmount: 2000,
            currentAmount: 1500,
            color: "#3b82f6",
            icon: "Laptop",
            createdAt: today.subtract(3, 'month').toISOString(),
            isCompleted: false
        },
        {
            id: uuid(),
            name: "Vacation",
            targetAmount: 5000,
            currentAmount: 1000,
            color: "#10b981",
            icon: "Plane",
            createdAt: today.subtract(1, 'month').toISOString(),
            isCompleted: false
        },
        {
            id: uuid(),
            name: "Emergency Fund",
            targetAmount: 10000,
            currentAmount: 10000,
            color: "#ef4444",
            icon: "Shield",
            createdAt: today.subtract(5, 'month').toISOString(),
            isCompleted: true
        }
    );

    const data = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        expenses: expenses,
        budgets: budgets,
        subscriptions: subscriptions,
        savings: savingsGoals,
        gamification: {
            level: 5,
            xp: 2500,
            totalXP: 2500,
            coins: 1200,
            totalCoins: 1500,
            streak: 15,
            lastCheckIn: new Date().toISOString(),
            badges: ["first_goal", "budget_master"],
            claimedTasks: [],
            history: [],
            redemptionHistory: [],
            createdAt: today.subtract(6, 'month').toISOString(),
        },
        settings: {
            currency: "USD",
            locale: "en-US",
            theme: "dark",
            cardTheme: "default",
            categories: categories,
            paymentMethods: ["Cash", "Credit Card", "Debit Card", "Bank Transfer"],
            premiumTheme: null,
            userName: "Demo User",
            hasCompletedOnboarding: true,
            hasCompletedTutorial: true,
            hasSeenIntro: true,
        },
        purchasedThemes: [],
        purchasedCards: [],
    };

    return encryptData(data);
};

const encrypted = generateData();
fs.writeFileSync('example_data.enc', encrypted);
console.log('Example data generated: example_data.enc');
