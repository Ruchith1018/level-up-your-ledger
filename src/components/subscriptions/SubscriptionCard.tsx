import { Subscription } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Calendar, CreditCard, CheckCircle2, RotateCcw, Pencil } from "lucide-react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useTransaction } from "@/hooks/useTransaction";
import { useSubscriptions } from "@/contexts/SubscriptionContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { toast } from "sonner";

interface SubscriptionCardProps {
  subscription: Subscription;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export function SubscriptionCard({ subscription, onToggle, onDelete, onEdit }: SubscriptionCardProps) {
  const { addTransaction } = useTransaction();
  const { markAsPaid, revertPayment } = useSubscriptions();
  const { deleteExpense } = useExpenses();

  const daysUntilDue = dayjs(subscription.billingDate).diff(dayjs(), "day");
  const isDue = daysUntilDue <= subscription.reminderDaysBefore;
  const isUpcoming = isDue && daysUntilDue >= 0;
  const isOverdue = daysUntilDue < 0;
  // Show "Paid" (Undo) if we have a transaction ID
  const isPaid = !!subscription.lastPaymentTransactionId;

  const handlePay = () => {
    const transactionId = addTransaction({
      type: "expense",
      amount: subscription.amount,
      category: subscription.category,
      paymentMethod: subscription.paymentMethod,
      merchant: subscription.title,
      notes: `Subscription payment for ${subscription.title}`,
    });

    if (transactionId) {
      markAsPaid(subscription.id, transactionId);
    }
  };

  const handleUndo = () => {
    if (subscription.lastPaymentTransactionId) {
      deleteExpense(subscription.lastPaymentTransactionId);
      revertPayment(subscription.id);
      toast.success("Payment reverted");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className={`${(isUpcoming || isOverdue) && subscription.active && !isPaid ? (isOverdue ? "border-destructive" : "border-warning") : ""} ${isPaid ? "border-green-500/50 bg-green-500/5" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{subscription.title}</h3>
                {isPaid && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              </div>
              <p className="text-sm text-muted-foreground">{subscription.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={subscription.active} onCheckedChange={onToggle} />
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">${subscription.amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Next billing
              </span>
              <span className={(isUpcoming || isOverdue) && subscription.active && !isPaid ? (isOverdue ? "text-destructive font-medium" : "text-warning font-medium") : ""}>
                {dayjs(subscription.billingDate).format("MMM DD, YYYY")}
                {isUpcoming && subscription.active && !isPaid && ` (${daysUntilDue} days)`}
                {isOverdue && subscription.active && !isPaid && ` (${Math.abs(daysUntilDue)} days ago)`}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                Payment
              </span>
              <span>{subscription.paymentMethod}</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {isPaid ? (
              <Button
                variant="outline"
                className="w-full gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
                onClick={handleUndo}
              >
                <RotateCcw className="w-4 h-4" />
                Undo Payment
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handlePay}
                disabled={!subscription.active}
              >
                <CheckCircle2 className="w-4 h-4" />
                Pay Now
              </Button>
            )}
          </div>

          {isUpcoming && subscription.active && !isPaid && (
            <div className="mt-3 bg-warning/10 text-warning text-xs p-2 rounded">
              ⚠️ Due in {daysUntilDue} day{daysUntilDue !== 1 && "s"}
            </div>
          )}

          {isOverdue && subscription.active && !isPaid && (
            <div className="mt-3 bg-destructive/10 text-destructive text-xs p-2 rounded">
              ⚠️ Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 && "s"}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
