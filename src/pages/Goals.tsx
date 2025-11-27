import { Button } from "@/components/ui/button";
import { ArrowLeft, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGoals } from "@/contexts/GoalContext";
import { GoalCard } from "@/components/goals/GoalCard";
import { AddGoalModal } from "@/components/goals/AddGoalModal";
import { motion } from "framer-motion";

export default function Goals() {
  const navigate = useNavigate();
  const { state } = useGoals();

  const activeGoals = state.goals.filter((g) => !g.completedAt);
  const completedGoals = state.goals.filter((g) => g.completedAt);
  const totalSaved = state.goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = state.goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-2">
            <Target className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Savings Goals
            </h1>
          </div>
          <p className="text-muted-foreground">Track your progress and celebrate achievements</p>
        </motion.div>

        {state.goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="p-6 rounded-xl bg-card border shadow-sm">
              <p className="text-sm text-muted-foreground">Total Saved</p>
              <p className="text-3xl font-bold text-primary">{totalSaved.toFixed(0)}</p>
            </div>
            <div className="p-6 rounded-xl bg-card border shadow-sm">
              <p className="text-sm text-muted-foreground">Total Target</p>
              <p className="text-3xl font-bold">{totalTarget.toFixed(0)}</p>
            </div>
            <div className="p-6 rounded-xl bg-card border shadow-sm">
              <p className="text-sm text-muted-foreground">Goals Completed</p>
              <p className="text-3xl font-bold text-success">{completedGoals.length}</p>
            </div>
          </motion.div>
        )}

        <div className="flex justify-center">
          <AddGoalModal />
        </div>

        {activeGoals.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Active Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>
        )}

        {completedGoals.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Completed Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>
        )}

        {state.goals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 space-y-4"
          >
            <Target className="w-16 h-16 mx-auto text-muted-foreground/50" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No goals yet</h3>
              <p className="text-muted-foreground">
                Create your first savings goal to start tracking your progress
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
