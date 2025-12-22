import { useExpenses } from "@/contexts/ExpenseContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBudget } from "@/contexts/BudgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, TrendingUp, TrendingDown, Pencil, AlertTriangle, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { BudgetForm } from "./BudgetForm";
import { CARD_THEMES, ALL_THEMES } from "@/constants/cardThemes";
import { useNavigate } from "react-router-dom";

export function BudgetOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getTotalByType } = useExpenses();
  const { getCurrentBudget, getBudgetByMonth, state: budgetState } = useBudget();
  const { settings } = useSettings();
  const currencySymbol = getCurrencySymbol(settings.currency);
  const currentMonth = dayjs().format("YYYY-MM");

  const activeTheme = ALL_THEMES.find(t => t.id === settings.cardTheme) || CARD_THEMES[0];

  const referralId = user?.user_metadata?.referral_id || "0000000000000000";
  const formattedReferralId = referralId.replace(/(.{4})/g, '$1 ').trim();

  const currentBudget = getCurrentBudget();
  const totalExpense = getTotalByType("expense", currentMonth);
  const totalIncome = getTotalByType("income", currentMonth);

  // Calculate Rollover
  const previousMonth = dayjs().subtract(1, 'month').format("YYYY-MM");
  const previousBudget = getBudgetByMonth(previousMonth);
  let rolloverAmount = 0;

  if (previousBudget && previousBudget.surplusAction === 'rollover') {
    const previousExpenses = getTotalByType("expense", previousMonth);
    rolloverAmount = Math.max(0, previousBudget.total - previousExpenses);
  }

  // Calculate Total Savings
  const totalSavings = budgetState.budgets
    .filter(b => b.surplusAction === 'saved')
    .reduce((sum, b) => {
      const expenses = getTotalByType("expense", b.month);
      const savedAmount = Math.max(0, b.total - expenses);
      return sum + savedAmount;
    }, 0);

  if (!currentBudget) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <PiggyBank className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No budget set for this month</p>
          <BudgetForm trigger={<Button>Create Budget</Button>} />
        </CardContent>
      </Card>
    );
  }

  const effectiveTotal = currentBudget.total + rolloverAmount;
  const remaining = effectiveTotal - totalExpense;
  const budgetUsed = (totalExpense / effectiveTotal) * 100;
  const isOverBudget = remaining < 0;

  const getFontSizeClass = (amount: number, type: 'main' | 'sub') => {
    const length = amount.toFixed(2).length;
    if (type === 'main') {
      if (length > 13) return "text-lg sm:text-xl";
      if (length > 10) return "text-xl sm:text-2xl";
      return "text-2xl sm:text-3xl";
    }
    // sub cards - more aggressive scaling for 2-column grid
    if (length > 11) return "text-xs";
    if (length > 8) return "text-sm sm:text-base";
    if (length > 6) return "text-base sm:text-lg";
    return "text-lg sm:text-xl";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-[420px] mx-auto aspect-[1.586/1] min-h-[220px] rounded-xl overflow-hidden shadow-xl card-shine min-w-[280px]"
        >
          {/* Card Background */}
          <div
            className="absolute inset-0 transition-all duration-500 bg-cover bg-center"
            style={{
              background: (activeTheme as any).image
                ? `url(${(activeTheme as any).image}) top center/cover no-repeat`
                : activeTheme.gradient
            }}
          >
            {/* Decorative Lines */}
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)'
              }}
            />
          </div>

          {/* Card Content */}
          <div className={`relative h-full p-3 sm:p-5 pb-5 sm:pb-7 flex flex-col justify-between ${activeTheme.textColor}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-medium text-[10px] sm:text-sm tracking-wider opacity-80`}>BudGlio Card</h3>
                {/* Chip */}
                <div className={`mt-2 sm:mt-3 w-8 h-6 sm:w-12 sm:h-9 bg-gradient-to-br ${activeTheme.chipColor} rounded-md border border-black/10 relative overflow-hidden shadow-sm`}>
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/20" />
                  <div className="absolute top-0 left-1/2 h-full w-[1px] bg-black/20" />
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 sm:w-4 sm:h-4 border border-black/20 rounded-sm transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 sm:gap-2">
                {/* Edit Button */}
                <BudgetForm
                  initialData={currentBudget}
                  trigger={
                    <Button variant="ghost" size="icon" className={`h-6 w-6 sm:h-8 sm:w-8 hover:bg-white/20 ${activeTheme.textColor}`}>
                      <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  }
                />
                {/* Contactless Icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`w-5 h-5 sm:w-8 sm:h-8 opacity-80 ${activeTheme.textColor}`} strokeWidth={2}>
                  <path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10 10 10 0 0 1-10-10 10 10 0 0 1 10-10z" stroke="none" />
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1.5-3.5" />
                  <path d="M15.5 14.5A2.5 2.5 0 0 1 13 12c0-1.38.5-2 1.5-3.5" />
                  <path d="M5 12h14" stroke="none" />
                  <path d="M8.4 8.4a6 6 0 0 1 7.2 0" />
                  <path d="M5.6 5.6a10 10 0 0 1 12.8 0" />
                </svg>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2 flex-1 flex flex-col justify-center">
              <div className="space-y-0.5">
                <div className="text-[8px] sm:text-xs opacity-60 uppercase tracking-wider">Remaining Balance</div>
                <div className={`${getFontSizeClass(Math.abs(remaining), 'main')} font-mono font-bold tracking-widest drop-shadow-md truncate leading-none pb-1`}>
                  {remaining < 0 ? "-" : ""}{currencySymbol}{Math.abs(remaining).toFixed(2)}
                </div>
              </div>
              <div className="font-mono text-xs sm:text-lg tracking-[0.15em] sm:tracking-[0.2em] drop-shadow-md opacity-80 truncate">
                {formattedReferralId}
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between items-end">
                <div className="max-w-[60%]">
                  <div className="text-[7px] sm:text-[10px] opacity-60 uppercase tracking-widest mb-0.5">Card Holder</div>
                  <div className="font-medium tracking-wider uppercase truncate text-[9px] sm:text-sm">
                    {settings.userName || user?.user_metadata?.full_name || "User"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[7px] sm:text-[10px] opacity-60 uppercase tracking-widest mb-0.5">Issued</div>
                  <div className="font-medium tracking-wider text-[9px] sm:text-sm">{user?.created_at ? dayjs(user.created_at).format('MM/YY') : dayjs().format('MM/YY')}</div>
                </div>
              </div>

              {/* Progress Bar styled for card */}
              <div className="relative w-full h-1 sm:h-1.5 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-500 ${isOverBudget ? "bg-red-500" : "bg-emerald-400"}`}
                  style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Over Budget Warning Overlay */}
          {isOverBudget && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/20 flex items-center justify-center pointer-events-none">
              <div className="bg-destructive/90 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse flex items-center gap-2 backdrop-blur-md">
                <AlertTriangle className="w-5 h-5" />
                <span>Over Limit!</span>
              </div>
            </div>
          )}
        </motion.div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => navigate('/income')}
              className="bg-blue-500/10 rounded-lg p-4 flex flex-col items-center justify-center text-center min-h-[100px] cursor-pointer hover:bg-blue-500/20 transition-colors relative"

            >
              <ChevronRight className="absolute top-2 right-2 w-4 h-4 text-blue-500 animate-pulse" />
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium leading-tight">Income</span>
              </div>
              <div className={`${getFontSizeClass(totalIncome, 'sub')} font-bold break-words transition-all duration-200 text-blue-700 dark:text-blue-300`}>{currencySymbol}{totalIncome.toFixed(2)}</div>
            </div>
            <div
              onClick={() => navigate('/expenses')}
              className="rounded-lg p-4 bg-red-500/10 flex flex-col items-center justify-center text-center min-h-[100px] cursor-pointer hover:bg-red-500/20 transition-colors relative"

            >
              <ChevronRight className="absolute top-2 right-2 w-4 h-4 text-red-500 animate-pulse" />
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-red-600 dark:text-red-400 mb-1">
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium leading-tight">Expenses</span>
              </div>
              <div className={`${getFontSizeClass(totalExpense, 'sub')} font-bold break-words transition-all duration-200 text-red-700 dark:text-red-300`}>{currencySymbol}{totalExpense.toFixed(2)}</div>
            </div>
          </div>
          <div
            onClick={() => navigate('/savings')}
            className="rounded-lg p-4 bg-emerald-500/10 flex flex-col items-center justify-center text-center min-h-[80px] cursor-pointer hover:bg-emerald-500/20 transition-colors w-full relative"
          >
            <ChevronRight className="absolute top-2 right-2 w-4 h-4 text-emerald-500 animate-pulse" />
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <PiggyBank className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium leading-tight">Total Savings</span>
            </div>
            <div className={`${getFontSizeClass(totalSavings, 'sub')} font-bold break-words transition-all duration-200 text-emerald-700 dark:text-emerald-300`}>{currencySymbol}{totalSavings.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
