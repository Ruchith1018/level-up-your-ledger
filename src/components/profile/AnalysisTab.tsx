import dayjs from "dayjs";
import { CircularScore } from "@/components/analysis/CircularScore";
import { Card } from "@/components/ui/card";
import {
    calculateFinancialHealthScore,
    calculateDisciplineScore,
    calculateConsistencyScore,
    calculateBurnRate,
    calculateGrowthRate
} from "@/utils/financialMetrics";
import { useSettings } from "@/contexts/SettingsContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { useBudget } from "@/contexts/BudgetContext";
import { useGamification } from "@/contexts/GamificationContext";

export function AnalysisTab() {
    const { settings } = useSettings();
    const { state: expenseState, getTotalByType } = useExpenses();
    const { state: budgetState } = useBudget();
    const { state: gamificationState } = useGamification();

    // Calculate Metrics for Analysis Tab
    const today = dayjs();
    const currentMonth = today.format('YYYY-MM');
    const lastMonth = today.subtract(1, 'month').format('YYYY-MM');
    const currencySymbol = settings.currency === 'INR' ? '₹' : settings.currency;

    // 1. Get Totals
    const currentIncome = getTotalByType("income", currentMonth);
    const currentExpenses = getTotalByType("expense", currentMonth);
    const lastMonthExpenses = getTotalByType("expense", lastMonth);

    // 2. Get Budget Info
    // Safe access to budgets array
    const budgets = budgetState?.budgets || [];
    const currentBudgetObj = budgets.find((b: any) => b.month === currentMonth);
    const totalBudget = currentBudgetObj ? Number(currentBudgetObj.total) : 0;

    // 3. Scores Calculation
    const healthScore = calculateFinancialHealthScore(
        currentIncome,
        currentExpenses,
        totalBudget,
        currentExpenses
    );

    // Filter current month transactions for discipline score
    const items = expenseState?.items || [];
    const currentMonthTransactions = items.filter((t: any) =>
        t.date && t.date.startsWith(currentMonth)
    ).map((t: any) => ({ ...t, type: 'expense' }));

    const dailyBudget = totalBudget > 0 ? totalBudget / today.daysInMonth() : 0;
    const disciplineScore = calculateDisciplineScore(currentMonthTransactions, dailyBudget);

    // Safe access to streak
    const streak = gamificationState?.streak || 0;
    const consistencyScore = calculateConsistencyScore(
        streak > 30 ? Math.floor(streak / 30) : 0,
        currentIncome,
        currentExpenses
    );

    // 4. Performance Metrics
    const savings = currentIncome - currentExpenses;
    const savingsRate = currentIncome > 0 ? (savings / currentIncome) * 100 : 0;

    const expenseGrowth = calculateGrowthRate(currentExpenses, lastMonthExpenses);

    const burnRateData = calculateBurnRate(currentExpenses, totalBudget);

    const expenseToIncomeRatio = currentIncome > 0 ? (currentExpenses / currentIncome) * 100 : 0;

    // 5. Generate Insights (Data-Driven)
    const getInsights = () => {
        const insights: { text: string; color: string }[] = [];

        // 0. Data Check
        if (currentIncome === 0 && currentExpenses === 0) {
            return [
                { text: "No financial data available for this month yet.", color: "text-muted-foreground" },
                { text: "Start adding income and expenses to see your financial analysis.", color: "text-muted-foreground" },
                { text: "Set a budget to track your spending limits.", color: "text-muted-foreground" },
                { text: "Your financial health score will update as you track activity.", color: "text-muted-foreground" }
            ];
        }

        // 1. Health Score Insight
        if (healthScore >= 80) {
            insights.push({ text: "Financial Health is Excellent! You are balancing income, savings, and expenses perfectly.", color: "text-green-500" });
        } else if (healthScore >= 60) {
            insights.push({ text: "Good Financial Health. You are on the right track, but could optimize your savings rate further.", color: "text-yellow-500" });
        } else if (healthScore >= 40) {
            insights.push({ text: "Fair Financial Health. Your expenses are high relative to your income. Consider cutting discretionary spending.", color: "text-orange-500" });
        } else {
            insights.push({ text: "Critical Financial Health. Your expenses exceed or nearly equal your income. Immediate budget review needed.", color: "text-red-500" });
        }

        // 2. Savings Insight
        if (currentIncome > 0) {
            if (savingsRate >= 20) {
                insights.push({ text: `Impressive! You are saving ${Math.round(savingsRate)}% of your income. This exceeds the recommended 20%.`, color: "text-green-500" });
            } else if (savingsRate > 5) {
                insights.push({ text: `You're saving ${Math.round(savingsRate)}%. Try to increase this to 20% by identifying non-essential expenses.`, color: "text-yellow-500" });
            } else if (savingsRate > 0) {
                insights.push({ text: `You're barely saving (${Math.round(savingsRate)}%). One unexpected expense could push you into debt.`, color: "text-orange-500" });
            } else {
                insights.push({ text: `Deficit Warning: You have spent ${Math.round(Math.abs(savingsRate))}% more than you earned this month.`, color: "text-red-500" });
            }
        } else {
            insights.push({ text: "No income recorded. Cannot calculate savings rate accurately.", color: "text-muted-foreground" });
        }

        // 3. Spending Trends
        if (Math.abs(expenseGrowth) < 5) {
            insights.push({ text: "Your spending is stable and consistent with last month.", color: "text-green-500" });
        } else if (expenseGrowth > 10) {
            insights.push({ text: `Spending Alert: Your expenses jumped by ${Math.round(expenseGrowth)}% compared to last month. Check for unusual large purchases.`, color: "text-red-500" });
        } else if (expenseGrowth < -10) {
            insights.push({ text: `Great progress! You reduced your spending by ${Math.round(Math.abs(expenseGrowth))}% compared to last month.`, color: "text-green-500" });
        } else {
            insights.push({ text: expenseGrowth > 0 ? "Minor increase in spending. Keep an eye on it." : "Slight decrease in spending. Good job.", color: "text-yellow-500" });
        }

        // 4. Burn Rate & Budget
        if (burnRateData.isOverBudget) {
            const overAmount = currentExpenses - totalBudget;
            insights.push({ text: `Budget Exceeded: You are over your budget by ${currencySymbol}${Math.round(overAmount)}. Stop spending immediately if possible.`, color: "text-red-500" });
        } else if (burnRateData.daysUntilExhaustion < 5 && burnRateData.daysUntilExhaustion > 0) {
            insights.push({ text: `Urgent: At your current daily spending, your budget will run out in ${burnRateData.daysUntilExhaustion} days.`, color: "text-red-500" });
        } else if (burnRateData.daysUntilExhaustion < 15) {
            insights.push({ text: `Pacing Warning: You have ${burnRateData.daysUntilExhaustion} days of budget left. Slow down daily spending.`, color: "text-yellow-500" });
        } else {
            insights.push({ text: "Your spending pace is sustainable. You are likely to stay within budget this month.", color: "text-green-500" });
        }

        return insights.slice(0, 4); // Ensure max 4 insights
    };

    const insights = getInsights();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {/* Left Column: Metrics (Span 2) */}
            <div className="lg:col-span-2 space-y-8">
                {/* Section 1: Core Scores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CircularScore
                        score={healthScore}
                        label="Financial Health"
                        insight={healthScore > 80 ? "Your financial health is Excellent." : healthScore > 50 ? "Good health, but room to improve." : "Reduce discretionary spending to improve."}
                        color={healthScore > 80 ? "text-green-500" : healthScore > 50 ? "text-yellow-500" : "text-red-500"}
                    />
                    <CircularScore
                        score={disciplineScore}
                        label="Spending Discipline"
                        insight={disciplineScore > 80 ? "You are highly disciplined!" : "Weekend spending often impacts your score."}
                        color={disciplineScore > 80 ? "text-blue-500" : disciplineScore > 50 ? "text-purple-500" : "text-orange-500"}
                    />
                    <CircularScore
                        score={consistencyScore}
                        label="Savings Consistency"
                        insight={consistencyScore > 70 ? "Consistent saver!" : "Try to save regularly every month."}
                        color={consistencyScore > 70 ? "text-cyan-500" : "text-pink-500"}
                    />
                </div>

                {/* Section 2: Performance Grid */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 px-1 flex items-center gap-2">
                        Financial Performance
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Savings Rate */}
                        <div className="p-4 bg-card rounded-xl border border-border/50 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Savings Rate</p>
                                    <h4 className="text-2xl font-bold mt-1">{Math.round(savingsRate)}%</h4>
                                </div>
                            </div>
                            <div className="w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${savingsRate >= 20 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(savingsRate, 100)}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {savingsRate < 10 ? 'Needs improvement (<10%)' : savingsRate < 20 ? 'Healthy (10-20%)' : 'Excellent (20%+)'}
                            </p>
                        </div>

                        {/* Expense Growth */}
                        <div className="p-4 bg-card rounded-xl border border-border/50 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Expense Growth</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <h4 className="text-2xl font-bold">{Math.round(Math.abs(expenseGrowth))}%</h4>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {expenseGrowth > 0 ? `Increased from last month` : `Decreased from last month`}
                            </p>
                        </div>

                        {/* Burn Rate */}
                        <div className="p-4 bg-card rounded-xl border border-border/50 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Burn Rate</p>
                                    <h4 className="text-2xl font-bold mt-1">{currencySymbol}{Math.round(burnRateData.dailyBurnRate)}<span className="text-sm font-normal text-muted-foreground">/day</span></h4>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {burnRateData.isOverBudget
                                    ? "Budget exceeded!"
                                    : burnRateData.daysUntilExhaustion < 30
                                        ? `Budget ends in ~${burnRateData.daysUntilExhaustion} days`
                                        : "Sustainable burn rate"}
                            </p>
                        </div>

                        {/* Expense-to-Income */}
                        <div className="p-4 bg-card rounded-xl border border-border/50 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Exp/Income Ratio</p>
                                    <h4 className="text-2xl font-bold mt-1">{Math.round(expenseToIncomeRatio)}%</h4>
                                </div>
                            </div>
                            <div className="w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${expenseToIncomeRatio < 70 ? 'bg-green-500' : expenseToIncomeRatio < 85 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(expenseToIncomeRatio, 100)}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {expenseToIncomeRatio < 70 ? 'Healthy (<70%)' : expenseToIncomeRatio < 85 ? 'Warning (>70%)' : 'Critical (>85%)'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Insights */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    Analysis Insights
                </h3>
                <Card className="p-6 h-fit bg-gradient-to-br from-card to-muted/20 border-border/50">
                    <div className="space-y-6">
                        {insights.map((insight, index) => (
                            <div key={index} className="flex gap-3 items-start">
                                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${insight.color.replace('text-', 'bg-')}/10 ${insight.color}`}>
                                    {index + 1}
                                </span>
                                <p className={`text-sm leading-relaxed text-justify ${insight.color}`}>
                                    {insight.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
