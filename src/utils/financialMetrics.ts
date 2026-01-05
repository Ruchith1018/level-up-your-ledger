import dayjs from 'dayjs';

interface Transaction {
    amount: number;
    type: 'income' | 'expense';
    date: string;
    category?: string;
}

interface Budget {
    total: number;
    spent: number;
}

export const calculateFinancialHealthScore = (
    income: number,
    expenses: number,
    totalBudget: number,
    totalSpent: number,
    hasEmergencyFund: boolean = false
) => {
    let score = 0;

    // 1. Savings Rate (40 points)
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    if (savingsRate >= 20) score += 40;
    else if (savingsRate >= 10) score += 25;
    else if (savingsRate > 0) score += 10;

    // 2. Budget Adherence (30 points)
    if (totalBudget > 0) {
        const adherence = (totalSpent / totalBudget) * 100;
        if (adherence <= 85) score += 30;
        else if (adherence <= 100) score += 15;
    }

    // 3. Expense-to-Income Ratio (30 points)
    const ratio = income > 0 ? (expenses / income) * 100 : 100;
    if (ratio < 50) score += 30;
    else if (ratio < 70) score += 20;
    else if (ratio < 90) score += 10;

    return Math.min(100, Math.round(score));
};

export const calculateDisciplineScore = (
    transactions: Transaction[],
    dailyBudget: number
) => {
    if (!transactions.length) return 50; // Neutral start

    // Group by day
    const dailySpending: Record<string, number> = {};
    transactions.forEach(t => {
        if (t.type === 'expense') {
            dailySpending[t.date] = (dailySpending[t.date] || 0) + Number(t.amount);
        }
    });

    const days = Object.keys(dailySpending).length;
    let daysWithinBudget = 0;

    Object.values(dailySpending).forEach(spent => {
        if (spent <= dailyBudget) daysWithinBudget++;
    });

    // % of days stayed within daily budget
    const score = days > 0 ? (daysWithinBudget / days) * 100 : 100;
    return Math.round(score);
};

export const calculateConsistencyScore = (
    savingsStreak: number, // In months
    monthlyIncome: number,
    monthlyExpenses: number
) => {
    let score = 0;

    // Streak factor (50 points)
    score += Math.min(50, savingsStreak * 10); // 5 months streak = max points

    // Regular saving factor (50 points)
    const saved = monthlyIncome - monthlyExpenses;
    if (saved > 0 && monthlyIncome > 0) {
        score += 50;
    }

    return Math.min(100, score);
};

export const calculateBurnRate = (
    currentExpenses: number,
    totalBudget: number
) => {
    const today = dayjs();
    const daysInMonth = today.daysInMonth();
    const currentDay = today.date();

    const dailyBurnRate = currentDay > 0 ? currentExpenses / currentDay : 0;
    const projectedSpend = dailyBurnRate * daysInMonth;

    let daysUntilExhaustion = Infinity;
    if (totalBudget > 0 && dailyBurnRate > 0) {
        const remainingBudget = totalBudget - currentExpenses;
        daysUntilExhaustion = remainingBudget > 0 ? Math.floor(remainingBudget / dailyBurnRate) : 0;
    }

    return {
        dailyBurnRate,
        projectedSpend,
        daysUntilExhaustion: daysUntilExhaustion === Infinity ? 30 : daysUntilExhaustion,
        isOverBudget: projectedSpend > totalBudget
    };
};

export const calculateGrowthRate = (
    currentMonthExpenses: number,
    lastMonthExpenses: number
) => {
    if (lastMonthExpenses === 0) return 0;
    return ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
};
