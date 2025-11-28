import { GamificationState } from "@/types";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

export function xpThreshold(level: number, base = 100): number {
  return Math.floor(base * Math.pow(level, 1.4));
}

export function addXP(
  user: GamificationState,
  xpGain: number,
  reason: string
): GamificationState {
  const updatedUser = { ...user };
  updatedUser.xp += xpGain;
  updatedUser.totalXP = (updatedUser.totalXP || 0) + xpGain;

  // Add to history (initialize if undefined)
  updatedUser.history = [
    { date: new Date().toISOString(), xpEarned: xpGain, reason },
    ...(updatedUser.history || []).slice(0, 49), // Keep last 50 entries
  ];

  // Level up
  while (updatedUser.xp >= xpThreshold(updatedUser.level)) {
    updatedUser.xp -= xpThreshold(updatedUser.level);
    updatedUser.level += 1;
    const coinReward = Math.floor(updatedUser.level * 10);
    updatedUser.coins += coinReward;
    updatedUser.totalCoins = (updatedUser.totalCoins || 0) + coinReward;
  }

  return updatedUser;
}

export function removeXP(
  user: GamificationState,
  xpLoss: number,
  reason: string
): GamificationState {
  const updatedUser = { ...user };
  updatedUser.xp = Math.max(0, updatedUser.xp - xpLoss);
  updatedUser.totalXP = Math.max(0, (updatedUser.totalXP || 0) - xpLoss);

  // Add to history
  updatedUser.history = [
    { date: new Date().toISOString(), xpEarned: -xpLoss, reason },
    ...(updatedUser.history || []).slice(0, 49),
  ];

  return updatedUser;
}

export function checkStreak(lastCheckIn: string): { streak: number; isNewDay: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastCheck = new Date(lastCheckIn);
  lastCheck.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastCheck.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return {
    streak: diffDays,
    isNewDay: diffDays > 0,
  };
}

export const XP_REWARDS = {
  ADD_EXPENSE: 5,
  ADD_INCOME: 5,
  UNDER_DAILY_BUDGET: 10,
  UNDER_MONTHLY_BUDGET: 100,
  DAILY_CHECKIN: 2,
  COMPLETE_CHALLENGE: 50,
  FIRST_TRANSACTION: 20,
  WEEK_STREAK: 30,
  MONTH_STREAK: 200,
};

export const BADGES = {
  FIRST_STEPS: { id: "first_steps", name: "First Steps", description: "Added your first transaction", icon: "🌱" },
  BUDGET_NINJA: { id: "budget_ninja", name: "Budget Ninja", description: "Stayed under budget for a month", icon: "🥷" },
  WEEK_WARRIOR: { id: "week_warrior", name: "Week Warrior", description: "7-day streak", icon: "🔥" },
  MONTH_MASTER: { id: "month_master", name: "Month Master", description: "30-day streak", icon: "👑" },
  SAVER_PRO: { id: "saver_pro", name: "Saver Pro", description: "Saved 20% of income", icon: "💰" },
  TRACKER_ELITE: { id: "tracker_elite", name: "Tracker Elite", description: "100 transactions logged", icon: "📝" },
  NO_SPEND_DAY: { id: "no_spend_day", name: "No Spend Day", description: "Logged 0 expenses for a day", icon: "🛑" },
  NO_SPEND_WEEK: { id: "no_spend_week", name: "No Spend Week", description: "7 days without expenses", icon: "🛡️" },
  BUDGET_BEGINNER: { id: "budget_beginner", name: "Budget Beginner", description: "Stayed within budget for 1 month", icon: "🥉" },
  BUDGET_PRO: { id: "budget_pro", name: "Budget Pro", description: "Stayed within budget for 3 months", icon: "🥈" },
  BUDGET_CHAMPION: { id: "budget_champion", name: "Budget Champion", description: "Stayed within budget for 6 months", icon: "🥇" },
  YEAR_OF_DISCIPLINE: { id: "year_of_discipline", name: "Year of Discipline", description: "Stayed within budget for 12 months", icon: "💎" },
  INCOME_LOGGER: { id: "income_logger", name: "Income Logger", description: "Added income 10 times", icon: "📈" },
  INCOME_STREAMER: { id: "income_streamer", name: "Income Streamer", description: "Added 3+ different income sources", icon: "🌊" },
  SALARY_MASTER: { id: "salary_master", name: "Salary Master", description: "First salary added", icon: "💼" },
  SIDE_HUSTLER: { id: "side_hustler", name: "Side Hustler", description: "Earned income from freelancing", icon: "💻" },
  LEVEL_UP_EARNER: { id: "level_up_earner", name: "Level Up Earner", description: "Income increased for 3 consecutive months", icon: "🚀" },

  // Expense Entry Milestones
  LOG_10: { id: "log_10", name: "Getting Started", description: "Logged 10 transactions", icon: "📝" },
  LOG_50: { id: "log_50", name: "Consistent Tracker", description: "Logged 50 transactions", icon: "📊" },
  // TRACKER_ELITE is 100 logs
  LOG_500: { id: "log_500", name: "Data Hoarder", description: "Logged 500 transactions", icon: "📚" },
  FINANCE_GURU: { id: "finance_guru", name: "Finance Guru", description: "Logged 1000 transactions", icon: "🧘" },

  // Net Worth Milestones
  POSITIVE_NET_WORTH: { id: "positive_net_worth", name: "In The Green", description: "Achieved positive net worth", icon: "💹" },
  UPWARD_GROWTH: { id: "upward_growth", name: "Upward Growth", description: "Net worth increased for 3 consecutive months", icon: "📈" },

  // Daily Logging Badges
  DAILY_STARTER: { id: "daily_starter", name: "Daily Starter", description: "Completed daily tasks 1 day", icon: "🌅" },
  DAILY_DUO: { id: "daily_duo", name: "Daily Duo", description: "Completed daily tasks 2 days in a row", icon: "👯" },
  DAILY_STREAK_3: { id: "daily_streak_3", name: "Daily Streak 3", description: "3-day daily task streak", icon: "🔥" },
  DAILY_STREAK_7: { id: "daily_streak_7", name: "Daily Streak 7", description: "1 week daily task streak", icon: "📅" },
  DAILY_STREAK_14: { id: "daily_streak_14", name: "Daily Streak 14", description: "2 weeks daily task streak", icon: "🗓️" },
  DAILY_STREAK_30: { id: "daily_streak_30", name: "Daily Streak 30", description: "1 month daily task streak", icon: "🌙" },
  DAILY_STREAK_50: { id: "daily_streak_50", name: "Daily Streak 50", description: "50 days daily task streak", icon: "🌟" },
  DAILY_STREAK_100: { id: "daily_streak_100", name: "Daily Streak 100", description: "100 days daily task streak", icon: "💯" },
  DAILY_MACHINE: { id: "daily_machine", name: "Daily Machine", description: "150 days daily task streak", icon: "🤖" },
  DAILY_LEGEND: { id: "daily_legend", name: "Daily Legend", description: "365 days daily task streak", icon: "👑" },

  // Weekly Logging Badges
  WEEKLY_STARTER: { id: "weekly_starter", name: "Weekly Starter", description: "Completed weekly tasks 1 week", icon: "🌱" },
  WEEKLY_CONSISTENT: { id: "weekly_consistent", name: "Weekly Consistent", description: "Completed weekly tasks 2 weeks in a row", icon: "🌿" },
  WEEKLY_STREAK_4: { id: "weekly_streak_4", name: "Weekly Warrior", description: "4 weeks weekly task streak", icon: "⚔️" },
  WEEKLY_STREAK_8: { id: "weekly_streak_8", name: "Weekly Master", description: "8 weeks weekly task streak", icon: "🛡️" },
  WEEKLY_DOMINATOR: { id: "weekly_dominator", name: "Weekly Dominator", description: "12 weeks weekly task streak", icon: "🏰" },
  WEEKLY_CHAMPION: { id: "weekly_champion", name: "Weekly Champion", description: "26 weeks weekly task streak", icon: "🏆" },
  WEEKLY_ACE: { id: "weekly_ace", name: "Weekly Ace", description: "52 weeks weekly task streak", icon: "👑" },

  // Monthly Logging Badges
  MONTHLY_TASK_STREAK_1: { id: "monthly_task_streak_1", name: "Monthly Beginner", description: "Completed monthly tasks 1 month", icon: "🥉" },
  MONTHLY_TASK_STREAK_2: { id: "monthly_task_streak_2", name: "MonthlyBuilder", description: "Completed monthly tasks 2 months in a row", icon: "🔨" },
  MONTHLY_TASK_STREAK_3: { id: "monthly_task_streak_3", name: "Monthly Consistent", description: "Completed monthly tasks 3 months in a row", icon: "📅" },
  MONTHLY_TASK_STREAK_6: { id: "monthly_task_streak_6", name: "Monthly Hero", description: "Completed monthly tasks 6 months in a row", icon: "🦸" },
  MONTHLY_TASK_STREAK_12: { id: "monthly_task_streak_12", name: "Monthly Champion", description: "Completed monthly tasks 12 months in a row", icon: "🏆" },
  MONTHLY_TASK_STREAK_18: { id: "monthly_task_streak_18", name: "Monthly Veteran", description: "Completed monthly tasks 18 months in a row", icon: "🎖️" },
  MONTHLY_TASK_STREAK_24: { id: "monthly_task_streak_24", name: "Monthly Master", description: "Completed monthly tasks 24 months in a row", icon: "👑" },
  MONTHLY_TASK_STREAK_36: { id: "monthly_task_streak_36", name: "Monthly Legend", description: "Completed monthly tasks 36 months in a row", icon: "💎" },
};

// Badge Logic Helpers

export function checkTransactionCount(transactions: any[], count: number): boolean {
  return transactions.length >= count;
}

export function checkSavingsRate(income: number, expenses: number, targetRate: number = 0.2): boolean {
  if (income <= 0) return false;
  const savings = income - expenses;
  return (savings / income) >= targetRate;
}

export function checkIncomeSources(transactions: any[], minSources: number = 3): boolean {
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const sources = new Set(incomeTransactions.map(t => t.category));
  return sources.size >= minSources;
}

export function checkNoSpendDay(transactions: any[], date: Date): boolean {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const expensesOnDay = transactions.filter(t =>
    t.type === 'expense' &&
    new Date(t.date) >= dayStart &&
    new Date(t.date) <= dayEnd
  );

  return expensesOnDay.length === 0;
}

export function checkNoSpendWeek(transactions: any[], endDate: Date): boolean {
  // Check last 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    if (!checkNoSpendDay(transactions, d)) return false;
  }
  return true;
}



export function getBadgeProgress(badgeId: string, transactions: any[], claimedTasks?: string[], currentStreak: number = 0, budgetState?: any): { current: number; target: number; unit: string } {
  switch (badgeId) {
    // Transaction Count Badges
    case BADGES.FIRST_STEPS.id:
      return { current: Math.min(transactions.length, 1), target: 1, unit: 'transaction' };
    case BADGES.LOG_10.id:
      return { current: Math.min(transactions.length, 10), target: 10, unit: 'transactions' };
    case BADGES.LOG_50.id:
      return { current: Math.min(transactions.length, 50), target: 50, unit: 'transactions' };
    case BADGES.TRACKER_ELITE.id:
      return { current: Math.min(transactions.length, 100), target: 100, unit: 'transactions' };
    case BADGES.LOG_500.id:
      return { current: Math.min(transactions.length, 500), target: 500, unit: 'transactions' };
    case BADGES.FINANCE_GURU.id:
      return { current: Math.min(transactions.length, 1000), target: 1000, unit: 'transactions' };

    // Income Badges
    case BADGES.INCOME_LOGGER.id: {
      const incomeCount = transactions.filter((t: any) => t.type === 'income').length;
      return { current: Math.min(incomeCount, 10), target: 10, unit: 'income transactions' };
    }
    case BADGES.INCOME_STREAMER.id: {
      const sources = new Set(transactions.filter((t: any) => t.type === 'income').map((t: any) => t.category)).size;
      return { current: Math.min(sources, 3), target: 3, unit: 'income sources' };
    }
    case BADGES.SALARY_MASTER.id: {
      const hasSalary = transactions.some((t: any) => t.type === 'income' && t.category.toLowerCase().includes('salary'));
      return { current: hasSalary ? 1 : 0, target: 1, unit: 'goal' };
    }
    case BADGES.SIDE_HUSTLER.id: {
      const hasFreelance = transactions.some((t: any) => t.type === 'income' && (t.category.toLowerCase().includes('freelance') || t.category.toLowerCase().includes('side')));
      return { current: hasFreelance ? 1 : 0, target: 1, unit: 'goal' };
    }

    // Savings & Net Worth Badges
    case BADGES.SAVER_PRO.id: {
      const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalExpenses = transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0);
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
      return { current: Math.min(Math.max(savingsRate, 0), 20), target: 20, unit: '% savings' };
    }
    case BADGES.POSITIVE_NET_WORTH.id: {
      const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalExpenses = transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0);
      const isPositive = totalIncome > totalExpenses;
      return { current: isPositive ? 1 : 0, target: 1, unit: 'goal' };
    }
    case BADGES.UPWARD_GROWTH.id: {
      // Track 3 consecutive months of net worth growth - requires historical tracking
      // For now, show as achievable goal
      const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalExpenses = transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0);
      const hasPositiveGrowth = totalIncome > totalExpenses;
      return { current: hasPositiveGrowth ? 1 : 0, target: 3, unit: 'months growth' };
    }

    // Streak Badges (login streak, not task streak)
    case BADGES.WEEK_WARRIOR.id:
      return { current: Math.min(currentStreak || 0, 7), target: 7, unit: 'days logged in' };
    case BADGES.MONTH_MASTER.id:
      return { current: Math.min(currentStreak || 0, 30), target: 30, unit: 'days logged in' };

    // No Spend Badges
    case BADGES.NO_SPEND_DAY.id: {
      // Check if there are any expenses today
      const today = new Date().toISOString().split('T')[0];
      const todayExpenses = transactions.filter((t: any) =>
        t.type === 'expense' && t.date && t.date.startsWith(today)
      );
      const noSpendToday = todayExpenses.length === 0;
      return { current: noSpendToday ? 1 : 0, target: 1, unit: 'no-spend day' };
    }
    case BADGES.NO_SPEND_WEEK.id: {
      // Check for 7 consecutive days without expenses
      const today = new Date();
      let consecutiveDays = 0;

      for (let i = 0; i < 14; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasExpenses = transactions.some((t: any) =>
          t.type === 'expense' && t.date && t.date.startsWith(dateStr)
        );

        if (!hasExpenses) {
          consecutiveDays++;
        } else if (consecutiveDays < 7) {
          consecutiveDays = 0;
        }

        if (consecutiveDays >= 7) break;
      }

      return { current: Math.min(consecutiveDays, 7), target: 7, unit: 'consecutive no-spend days' };
    }

    // Budget Badges (requires budget state)
    case BADGES.BUDGET_NINJA.id:
    case BADGES.BUDGET_BEGINNER.id: {
      // Check current month budget status
      if (!budgetState || !budgetState.budgets || budgetState.budgets.length === 0) {
        return { current: 0, target: 1, unit: 'month under budget' };
      }

      const currentMonth = new Date().toISOString().substring(0, 7);
      const currentBudget = budgetState.budgets.find((b: any) => b.month === currentMonth);

      if (!currentBudget) {
        return { current: 0, target: 1, unit: 'month under budget' };
      }

      const monthExpenses = transactions
        .filter((t: any) => t.type === 'expense' && t.date && t.date.startsWith(currentMonth))
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const underBudget = monthExpenses <= currentBudget.total;
      return { current: underBudget ? 1 : 0, target: 1, unit: 'month under budget' };
    }
    case BADGES.BUDGET_PRO.id: {
      // Track months under budget - simplified to show target
      return { current: 0, target: 3, unit: 'months under budget' };
    }
    case BADGES.BUDGET_CHAMPION.id: {
      return { current: 0, target: 6, unit: 'months under budget' };
    }
    case BADGES.YEAR_OF_DISCIPLINE.id: {
      return { current: 0, target: 12, unit: 'months under budget' };
    }

    // Income Growth Badge
    case BADGES.LEVEL_UP_EARNER.id: {
      // Check if income is increasing - simplified version
      const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0);
      const hasIncome = totalIncome > 0;
      return { current: hasIncome ? 1 : 0, target: 3, unit: 'months income growth' };
    }
    // Daily Task Streak Badges
    case BADGES.DAILY_STARTER.id:
      return { current: claimedTasks ? Math.min(calculateDailyTaskStreak(claimedTasks), 1) : 0, target: 1, unit: 'day streak' };
    case BADGES.DAILY_DUO.id:
      return { current: claimedTasks ? Math.min(calculateDailyTaskStreak(claimedTasks), 2) : 0, target: 2, unit: 'days streak' };
    case BADGES.DAILY_STREAK_3.id:
      return { current: claimedTasks ? Math.min(calculateDailyTaskStreak(claimedTasks), 3) : 0, target: 3, unit: 'days streak' };
    case BADGES.DAILY_STREAK_7.id:
      return { current: claimedTasks ? Math.min(calculateDailyTaskStreak(claimedTasks), 7) : 0, target: 7, unit: 'days streak' };
    case BADGES.DAILY_STREAK_14.id:
      return { current: claimedTasks ? Math.min(calculateDailyTaskStreak(claimedTasks), 14) : 0, target: 14, unit: 'days streak' };
    case BADGES.DAILY_STREAK_30.id:
      return { current: claimedTasks ? Math.min(calculateDailyTaskStreak(claimedTasks), 30) : 0, target: 30, unit: 'days streak' };
    case BADGES.DAILY_STREAK_50.id:
      return { current: claimedTasks ? Math.min(calculateDailyTaskStreak(claimedTasks), 50) : 0, target: 50, unit: 'days streak' };
    case BADGES.DAILY_STREAK_100.id:
      return { current: claimedTasks ? Math.min(calculateDailyTaskStreak(claimedTasks), 100) : 0, target: 100, unit: 'days streak' };
    case BADGES.DAILY_MACHINE.id:
      return { current: claimedTasks ? Math.min(calculateDailyTaskStreak(claimedTasks), 150) : 0, target: 150, unit: 'days streak' };
    case BADGES.DAILY_LEGEND.id:
      return { current: claimedTasks ? Math.min(calculateDailyTaskStreak(claimedTasks), 365) : 0, target: 365, unit: 'days streak' };

    // Weekly Task Streak Badges
    case BADGES.WEEKLY_STARTER.id:
      return { current: claimedTasks ? Math.min(calculateWeeklyTaskStreak(claimedTasks), 1) : 0, target: 1, unit: 'week streak' };
    case BADGES.WEEKLY_CONSISTENT.id:
      return { current: claimedTasks ? Math.min(calculateWeeklyTaskStreak(claimedTasks), 2) : 0, target: 2, unit: 'weeks streak' };
    case BADGES.WEEKLY_STREAK_4.id:
      return { current: claimedTasks ? Math.min(calculateWeeklyTaskStreak(claimedTasks), 4) : 0, target: 4, unit: 'weeks streak' };
    case BADGES.WEEKLY_STREAK_8.id:
      return { current: claimedTasks ? Math.min(calculateWeeklyTaskStreak(claimedTasks), 8) : 0, target: 8, unit: 'weeks streak' };
    case BADGES.WEEKLY_DOMINATOR.id:
      return { current: claimedTasks ? Math.min(calculateWeeklyTaskStreak(claimedTasks), 12) : 0, target: 12, unit: 'weeks streak' };
    case BADGES.WEEKLY_CHAMPION.id:
      return { current: claimedTasks ? Math.min(calculateWeeklyTaskStreak(claimedTasks), 26) : 0, target: 26, unit: 'weeks streak' };
    case BADGES.WEEKLY_ACE.id:
      return { current: claimedTasks ? Math.min(calculateWeeklyTaskStreak(claimedTasks), 52) : 0, target: 52, unit: 'weeks streak' };

    // Monthly Task Streak Badges
    case BADGES.MONTHLY_TASK_STREAK_1.id:
      return { current: claimedTasks ? Math.min(calculateMonthlyTaskStreak(claimedTasks), 1) : 0, target: 1, unit: 'month streak' };
    case BADGES.MONTHLY_TASK_STREAK_2.id:
      return { current: claimedTasks ? Math.min(calculateMonthlyTaskStreak(claimedTasks), 2) : 0, target: 2, unit: 'months streak' };
    case BADGES.MONTHLY_TASK_STREAK_3.id:
      return { current: claimedTasks ? Math.min(calculateMonthlyTaskStreak(claimedTasks), 3) : 0, target: 3, unit: 'months streak' };
    case BADGES.MONTHLY_TASK_STREAK_6.id:
      return { current: claimedTasks ? Math.min(calculateMonthlyTaskStreak(claimedTasks), 6) : 0, target: 6, unit: 'months streak' };
    case BADGES.MONTHLY_TASK_STREAK_12.id:
      return { current: claimedTasks ? Math.min(calculateMonthlyTaskStreak(claimedTasks), 12) : 0, target: 12, unit: 'months streak' };
    case BADGES.MONTHLY_TASK_STREAK_18.id:
      return { current: claimedTasks ? Math.min(calculateMonthlyTaskStreak(claimedTasks), 18) : 0, target: 18, unit: 'months streak' };
    case BADGES.MONTHLY_TASK_STREAK_24.id:
      return { current: claimedTasks ? Math.min(calculateMonthlyTaskStreak(claimedTasks), 24) : 0, target: 24, unit: 'months streak' };
    case BADGES.MONTHLY_TASK_STREAK_36.id:
      return { current: claimedTasks ? Math.min(calculateMonthlyTaskStreak(claimedTasks), 36) : 0, target: 36, unit: 'months streak' };

    default:
      return { current: 0, target: 1, unit: 'goal' };
  }
}

export function calculateDailyTaskStreak(claimedTasks: string[]): number {
  if (!claimedTasks || claimedTasks.length === 0) return 0;

  // Filter for daily tasks and extract dates
  const dailyTaskDates = claimedTasks
    .filter(id => id.startsWith('daily_'))
    .map(id => {
      const parts = id.split('_');
      // The date is the last part: YYYY-MM-DD
      return parts[parts.length - 1];
    })
    .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)) // Ensure valid date format
    .sort();

  if (dailyTaskDates.length === 0) return 0;

  const uniqueDates = Array.from(new Set(dailyTaskDates));

  // Calculate streak from today backwards
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today is in the list
  const todayStr = today.toISOString().split('T')[0];
  const hasToday = uniqueDates.includes(todayStr);

  // Let's count backwards from today (or yesterday if today is missing)
  let checkDate = new Date(today);

  if (!hasToday) {
    // If today is not done, check yesterday
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];
    if (!uniqueDates.includes(yesterdayStr)) {
      return 0; // Streak broken
    }
  }

  // Now count backwards
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (uniqueDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateWeeklyTaskStreak(claimedTasks: string[]): number {
  if (!claimedTasks || claimedTasks.length === 0) return 0;

  // Filter for weekly tasks and extract weeks
  // Format from Gamification.tsx: `${task.id}_${today.format('YYYY-Www')}`
  const weeklyTaskWeeks = claimedTasks
    .filter(id => id.includes('weekly_'))
    .map(id => {
      const parts = id.split('_');
      // The week part is at the end: YYYY-Www
      return parts[parts.length - 1];
    })
    .filter(week => /^\d{4}-W\d{1,2}$/.test(week))
    .sort();

  if (weeklyTaskWeeks.length === 0) return 0;

  const uniqueWeeks = Array.from(new Set(weeklyTaskWeeks));

  // Calculate streak from current week backwards
  let streak = 0;
  const currentWeek = dayjs();

  const thisWeekStr = currentWeek.format('YYYY-Www');
  const hasThisWeek = uniqueWeeks.includes(thisWeekStr);

  let checkWeek = dayjs(currentWeek);

  if (!hasThisWeek) {
    // If not this week, check last week
    checkWeek = checkWeek.subtract(1, 'week');
    const lastWeekStr = checkWeek.format('YYYY-Www');
    if (!uniqueWeeks.includes(lastWeekStr)) {
      return 0;
    }
  }

  while (true) {
    const weekStr = checkWeek.format('YYYY-Www');
    if (uniqueWeeks.includes(weekStr)) {
      streak++;
      checkWeek = checkWeek.subtract(1, 'week');
    } else {
      break;
    }
  }

  return streak;
}

export function calculateMonthlyTaskStreak(claimedTasks: string[]): number {
  if (!claimedTasks || claimedTasks.length === 0) return 0;

  // Filter for monthly tasks and extract months
  // Format from Gamification.tsx: `${task.id}_${today.format('YYYY-MM')}`
  const monthlyTaskMonths = claimedTasks
    .filter(id => id.includes('monthly_'))
    .map(id => {
      const parts = id.split('_');
      // The month part is at the end: YYYY-MM
      return parts[parts.length - 1];
    })
    .filter(month => /^\d{4}-\d{2}$/.test(month))
    .sort();

  if (monthlyTaskMonths.length === 0) return 0;

  const uniqueMonths = Array.from(new Set(monthlyTaskMonths));

  // Calculate streak from current month backwards
  let streak = 0;
  const currentMonth = dayjs();

  const thisMonthStr = currentMonth.format('YYYY-MM');
  const hasThisMonth = uniqueMonths.includes(thisMonthStr);

  let checkMonth = dayjs(currentMonth);

  if (!hasThisMonth) {
    // If not this month, check last month
    checkMonth = checkMonth.subtract(1, 'month');
    const lastMonthStr = checkMonth.format('YYYY-MM');
    if (!uniqueMonths.includes(lastMonthStr)) {
      return 0;
    }
  }

  while (true) {
    const monthStr = checkMonth.format('YYYY-MM');
    if (uniqueMonths.includes(monthStr)) {
      streak++;
      checkMonth = checkMonth.subtract(1, 'month');
    } else {
      break;
    }
  }

  return streak;
}
