import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useTransaction } from "@/hooks/useTransaction";
import { useFamilyBudget } from "@/hooks/useFamilyBudget";
import { useBudget } from "@/contexts/BudgetContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import dayjs from "dayjs";

export function AddExpenseModal() {
  const { settings } = useSettings();
  const { addTransaction } = useTransaction();
  const { familyBudget, refreshFamilyBudget } = useFamilyBudget();
  const { getCurrentBudget } = useBudget();
  const { getTotalByType } = useExpenses();
  const [open, setOpen] = useState(false);

  // Refresh family budget data when modal opens
  useEffect(() => {
    if (open) {
      refreshFamilyBudget();
    }
  }, [open]);

  const [formData, setFormData] = useState({
    amount: "",
    type: "expense" as "expense" | "income" | "savings",
    category: "",
    merchant: "",
    paymentMethod: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type === "savings") {
      if (!formData.amount) {
        toast.error("Please enter an amount");
        return;
      }
    } else {
      if (!formData.amount || !formData.category || !formData.paymentMethod) {
        toast.error("Please fill in all required fields");
        return;
      }
    }

    const amount = parseFloat(formData.amount);

    // Savings Validation
    if (formData.type === "savings") {
      const currentMonth = dayjs().format("YYYY-MM");
      const currentBudget = getCurrentBudget();

      if (currentBudget) {
        const totalExpense = getTotalByType("expense", currentMonth);

        // Calculate Rollover (logic from BudgetOverview)
        // Note: For a perfect sync, this logic should ideally be centralized, 
        // but calculating here for validation is acceptable.
        // We assume previous month's surplus was handled (either rolled over or not).
        // If rolled over, it's added to expenses/income? Actually in BudgetContext, 
        // rollover is added as an INCOME transaction.
        // So `currentBudget.total` is the base.
        // Wait, if rollover is an INCOME, does it increase the budget total via `total` property?
        // No, `currentBudget.total` is the set limit.
        // Let's check how BudgetOverview calculates `effectiveTotal`.
        // EffectiveTotal = currentBudget.total + rolloverAmount.
        // RolloverAmount is calculated from previous month's unspent.
        // BUT, if the rollover was already processed into an income entry (which BudgetContext does),
        // we shouldn't double count it?
        // BudgetContext::addBudget -> creates 'Surplus' income entry if rollover.
        // So checking BudgetOverview again...
        // BudgetOverview calculates rolloverAmount dynamically:
        // const previousBudget = getBudgetByMonth(previousMonth);
        // ... rolloverAmount = Math.max(0, previousBudget.total - previousExpenses);
        // AND effectiveTotal = currentBudget.total + rolloverAmount;
        // It seems `BudgetOverview` effectively ignores the created income entry for its "Budget Overview" card visualization 
        // OR the created income entry is just for record keeping?

        // Let's rely on what `BudgetOverview` does for consistency:
        // It ADDS calculated rollover to the total.

        // NOTE: Ideally, we should unify this. 
        // For now, I will replicate the logic to ensure consistent behavior with the Overview card.

        // However, if we simply check (Budget - Expenses), we need to be careful.

        // Re-deriving remaining balance:
        // 1. Get current budget limit.
        // 2. Add rollover from previous month if enabled.
        // 3. Subtract current expenses.

        // Note: We need `getBudgetByMonth` for rollover calc.
        // But `getCurrentBudget` is already imported.
      }

      // Let's simplify: functionality first. 
      // User asked: "make sure user cannot enter more than remaining balance"
      // Detailed logic replication:
    }

    // Family Budget Validation
    let familyBudgetID: string | undefined;
    if (formData.paymentMethod === "Family Budget") {
      if (!familyBudget || familyBudget.status !== 'spending') {
        toast.error("Family budget is not in spending mode");
        return;
      }

      if (amount > (familyBudget.user_remaining_limit || 0)) {
        toast.error(`Amount exceeds your remaining limit of ₹${familyBudget.user_remaining_limit}`);
        return;
      }

      if (amount > familyBudget.remaining_budget) {
        toast.error(`Amount exceeds total family budget remaining ₹${familyBudget.remaining_budget}`);
        return;
      }

      familyBudgetID = familyBudget.id;
    }

    if (formData.type === "savings") {
      // Final validation before submit
      const currentMonth = dayjs().format("YYYY-MM");
      const currentBudget = getCurrentBudget();
      const totalExpense = getTotalByType("expense", currentMonth);

      // We need to access getBudgetByMonth from context or state to calc rollover
      // Since I can't easily add getBudgetByMonth to the scope without changing the component hook usage significantly (or assuming it's available on context)
      // Actually `useBudget` provides `getBudgetByMonth`. I should destructure it.
      // Let's add `getBudgetByMonth` to the destructuring above.

      // Temporary placeholder for validation logic to be filled in correctly below
    }

    addTransaction({
      type: formData.type === "savings" ? "expense" : formData.type,
      amount: amount,
      category: formData.type === "savings" ? "Savings" : formData.category,
      merchant: formData.type === "savings" ? "Savings" : formData.merchant,
      paymentMethod: formData.type === "savings" ? "Savings" : formData.paymentMethod,
      notes: formData.notes,
      familyBudgetID: familyBudgetID
    });

    // Reset form
    setFormData({
      amount: "",
      type: "expense",
      category: "",
      merchant: "",
      paymentMethod: "",
      notes: "",
    });

    setOpen(false);
  };

  const showFamilyOption = familyBudget && familyBudget.status === 'spending' && familyBudget.user_role !== 'viewer';

  // Validation Logic Helpers
  const { getBudgetByMonth } = useBudget();

  const getRemainingBalance = () => {
    const currentMonth = dayjs().format("YYYY-MM");
    const currentBudget = getCurrentBudget();
    if (!currentBudget) return 0;

    const totalExpense = getTotalByType("expense", currentMonth);

    // Calculate Rollover
    const previousMonth = dayjs().subtract(1, 'month').format("YYYY-MM");
    const previousBudget = getBudgetByMonth(previousMonth);
    let rolloverAmount = 0;

    if (previousBudget && previousBudget.surplusAction === 'rollover') {
      const previousExpenses = getTotalByType("expense", previousMonth);
      rolloverAmount = Math.max(0, previousBudget.total - previousExpenses);
    }

    const effectiveTotal = currentBudget.total + rolloverAmount;
    return effectiveTotal - totalExpense;
  };

  // Intercept submit for Savings validation
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type === "savings") {
      const remaining = getRemainingBalance();
      if (parseFloat(formData.amount) > remaining) {
        toast.error(`Amount exceeds remaining budget of ₹${remaining.toFixed(2)}`);
        return;
      }
    }

    handleSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          id="add-expense-btn"
          size="lg"
          className="fixed bottom-28 md:bottom-6 right-6 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40 p-0"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto w-[90%] max-w-lg rounded-lg">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Record a new expense, income, or savings</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as "expense" | "income" | "savings" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{formData.type === "income" ? "Amount Earned *" : "Amount *"}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            {formData.type === "savings" && (
              <div className="text-xs text-muted-foreground mt-1">
                <span className="text-emerald-600 font-medium">Available Balance: ₹{getRemainingBalance().toFixed(2)}</span>
              </div>
            )}
            {formData.paymentMethod === "Family Budget" && familyBudget && (
              <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                <span className="text-green-600 font-medium">Available Limit: ₹{familyBudget.user_remaining_limit}</span>
                <span>Family Rem: ₹{familyBudget.remaining_budget}</span>
              </div>
            )}
          </div>

          {formData.type !== "savings" && (
            <div className="space-y-2">
              <Label htmlFor="category">{formData.type === "income" ? "Source *" : "Category *"}</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.type === "income" ? "Select source" : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.type === "income" ? (
                    <>
                      <SelectItem value="Job">Job</SelectItem>
                      <SelectItem value="Freelancing">Freelancing</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                      <SelectItem value="Person (interest)">Person (interest)</SelectItem>
                      <SelectItem value="Money Lender">Money Lender</SelectItem>
                    </>
                  ) : (
                    settings.categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.type !== "savings" && (
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">{formData.type === "income" ? "Credit Type *" : "Payment Method *"}</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.type === "income" ? "Select credit type" : "Select payment method"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.type === "income" ? (
                    <>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </>
                  ) : (
                    <>
                      {showFamilyOption && (
                        <SelectItem value="Family Budget" className="text-purple-600 font-medium focus:text-purple-700 bg-purple-50 focus:bg-purple-100">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-3.5 h-3.5" />
                            Family Budget
                          </div>
                        </SelectItem>
                      )}
                      {settings.paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.type !== "savings" && (
            <div className="space-y-2">
              <Label htmlFor="merchant">{formData.type === "income" ? "Sender / Company Name" : "Merchant"}</Label>
              <Input
                id="merchant"
                placeholder={formData.type === "income" ? "Name of Sender or Company" : "Where did you spend?"}
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {formData.type === "savings" ? "Add to Savings" : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
