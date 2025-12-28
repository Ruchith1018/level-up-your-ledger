import { useExpenses } from "@/contexts/ExpenseContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";
import { useTransaction } from "@/hooks/useTransaction";
import { useNavigate } from "react-router-dom";

dayjs.extend(relativeTime);

export function TransactionList() {
  const navigate = useNavigate();
  const { state } = useExpenses();
  const { deleteTransaction } = useTransaction();
  const { settings } = useSettings();
  const currencySymbol = getCurrencySymbol(settings.currency);
  const recentTransactions = state.items.slice(0, 10);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (recentTransactions.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="ghost" className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => navigate("/transactions")}>ALL</Button>
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="ghost" onClick={() => navigate("/transactions")}>ALL</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentTransactions.map((transaction, index) => {
            const isExpanded = expandedId === transaction.id;

            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                layout
                onClick={() => setExpandedId(isExpanded ? null : transaction.id)}
                className={`flex flex-col p-3 rounded-lg border border-border transition-colors cursor-pointer ${isExpanded ? "bg-muted/50" : "hover:bg-muted/50"
                  }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${transaction.type === "income"
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
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium ${isExpanded ? "whitespace-normal" : "truncate"}`}>
                        {transaction.category}
                      </div>
                      {isExpanded ? (
                        <div className="flex flex-col mt-1 space-y-0.5">
                          <div className="text-sm text-muted-foreground whitespace-normal">
                            {transaction.merchant || transaction.paymentMethod}
                          </div>
                          <div className="text-xs text-muted-foreground/80">
                            {dayjs(transaction.date).fromNow()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground truncate">
                          {transaction.merchant || transaction.paymentMethod} •{" "}
                          {dayjs(transaction.date).fromNow()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-2 shrink-0">
                    <div
                      className={`font-semibold whitespace-nowrap ${transaction.type === "income" ? "text-secondary" : "text-destructive"
                        }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}{currencySymbol}{transaction.amount.toFixed(2)}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-2 border-t border-border/50 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {dayjs(transaction.date).format("MMMM D, YYYY h:mm A")}
                        </div>
                        {!transaction.isLocked && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTransaction(transaction.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        )}
                        {transaction.isLocked && (
                          <span className="text-xs text-muted-foreground italic flex items-center">
                            🔒 Family Contribution
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
