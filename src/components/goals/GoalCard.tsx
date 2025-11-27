import { Goal } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Target, Trash2, PartyPopper } from "lucide-react";
import { useGoals } from "@/contexts/GoalContext";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dayjs from "dayjs";
import { motion } from "framer-motion";

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const { addFundsToGoal, deleteGoal } = useGoals();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState("");

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const isComplete = goal.completedAt !== undefined;
  const daysLeft = goal.deadline ? dayjs(goal.deadline).diff(dayjs(), "day") : null;

  const handleAddFunds = () => {
    const value = parseFloat(amount);
    if (value > 0) {
      addFundsToGoal(goal.id, value);
      setAmount("");
      setShowAddFunds(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className={`relative overflow-hidden ${isComplete ? "border-success" : ""}`}>
        {isComplete && (
          <motion.div
            className="absolute top-2 right-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <PartyPopper className="w-8 h-8 text-success" />
          </motion.div>
        )}
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${goal.color}20` }}
              >
                {goal.icon}
              </div>
              <div>
                <CardTitle className="text-xl">{goal.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{goal.category}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteGoal(goal.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">
                {goal.currentAmount.toFixed(0)} / {goal.targetAmount.toFixed(0)}
              </span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.toFixed(1)}% complete</span>
              {daysLeft !== null && daysLeft >= 0 && (
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {daysLeft} days left
                </span>
              )}
            </div>
          </div>

          {!isComplete && (
            <>
              {showAddFunds ? (
                <div className="space-y-2">
                  <Label htmlFor={`amount-${goal.id}`}>Add Funds</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`amount-${goal.id}`}
                      type="number"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddFunds()}
                    />
                    <Button onClick={handleAddFunds}>Add</Button>
                    <Button variant="outline" onClick={() => setShowAddFunds(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowAddFunds(true)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Funds
                </Button>
              )}
            </>
          )}

          {isComplete && (
            <div className="p-3 bg-success/10 rounded-lg text-center">
              <p className="text-success font-semibold">🎉 Goal Achieved!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Completed on {dayjs(goal.completedAt).format("MMM D, YYYY")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
