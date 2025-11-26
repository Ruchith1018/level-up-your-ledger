import { Subscription } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Calendar, CreditCard } from "lucide-react";
import dayjs from "dayjs";
import { motion } from "framer-motion";

interface SubscriptionCardProps {
  subscription: Subscription;
  onToggle: () => void;
  onDelete: () => void;
}

export function SubscriptionCard({ subscription, onToggle, onDelete }: SubscriptionCardProps) {
  const daysUntilDue = dayjs(subscription.billingDate).diff(dayjs(), "day");
  const isUpcoming = daysUntilDue <= subscription.reminderDaysBefore && daysUntilDue >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className={`${isUpcoming && subscription.active ? "border-warning" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{subscription.title}</h3>
              <p className="text-sm text-muted-foreground">{subscription.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={subscription.active} onCheckedChange={onToggle} />
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
              <span className={isUpcoming && subscription.active ? "text-warning font-medium" : ""}>
                {dayjs(subscription.billingDate).format("MMM DD, YYYY")}
                {isUpcoming && subscription.active && ` (${daysUntilDue} days)`}
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

          {isUpcoming && subscription.active && (
            <div className="mt-3 bg-warning/10 text-warning text-xs p-2 rounded">
              ⚠️ Due in {daysUntilDue} day{daysUntilDue !== 1 && "s"}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
