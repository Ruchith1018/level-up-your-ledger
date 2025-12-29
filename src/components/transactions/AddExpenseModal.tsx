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

export function AddExpenseModal() {
  const { settings } = useSettings();
  const { addTransaction } = useTransaction();
  const { familyBudget, refreshFamilyBudget } = useFamilyBudget();
  const [open, setOpen] = useState(false);

  // Refresh family budget data when modal opens
  useEffect(() => {
    if (open) {
      refreshFamilyBudget();
    }
  }, [open]);

  const [formData, setFormData] = useState({
    amount: "",
    type: "expense" as "expense" | "income",
    category: "",
    merchant: "",
    paymentMethod: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category || !formData.paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);

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

    addTransaction({
      type: formData.type,
      amount: amount,
      category: formData.category,
      merchant: formData.merchant,
      paymentMethod: formData.paymentMethod,
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

  const showFamilyOption = familyBudget && familyBudget.status === 'spending';

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
          <DialogDescription>Record a new expense or income transaction</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as "expense" | "income" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
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
            {formData.paymentMethod === "Family Budget" && familyBudget && (
              <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                <span className="text-green-600 font-medium">Available Limit: ₹{familyBudget.user_remaining_limit}</span>
                <span>Family Rem: ₹{familyBudget.remaining_budget}</span>
              </div>
            )}
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="merchant">{formData.type === "income" ? "Sender / Company Name" : "Merchant"}</Label>
            <Input
              id="merchant"
              placeholder={formData.type === "income" ? "Name of Sender or Company" : "Where did you spend?"}
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
            />
          </div>

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
              Add Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
