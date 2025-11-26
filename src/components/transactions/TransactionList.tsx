import { useExpenses } from "@/contexts/ExpenseContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function TransactionList() {
  const { state, deleteExpense } = useExpenses();
  const recentTransactions = state.items.slice(0, 10);

  if (recentTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No transactions yet. Add your first transaction to get started!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === "income"
                      ? "bg-secondary/10 text-secondary"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {transaction.type === "income" ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{transaction.category}</div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.merchant || transaction.paymentMethod} •{" "}
                    {dayjs(transaction.date).fromNow()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`font-semibold ${
                    transaction.type === "income" ? "text-secondary" : "text-destructive"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteExpense(transaction.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
