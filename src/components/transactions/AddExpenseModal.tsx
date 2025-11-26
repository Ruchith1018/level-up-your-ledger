import { useState } from "react";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useTransaction } from "@/hooks/useTransaction";

export function AddExpenseModal() {
  const { settings } = useSettings();
  const { addTransaction } = useTransaction();
  const [open, setOpen] = useState(false);

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

    addTransaction({
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      merchant: formData.merchant,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-20 md:bottom-6 right-6 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40 p-0"
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
                  settings.paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))
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
