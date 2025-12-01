import { SavingsGoal, useSavings } from "@/contexts/SavingsContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getCurrencySymbol } from "@/constants/currencies";
import { useSettings } from "@/contexts/SettingsContext";
import { Pencil, Trash2, Plus, Target, CheckCircle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";

import { forwardRef } from "react";

// ... imports

interface SavingsGoalCardProps {
    goal: SavingsGoal;
    onEdit: (goal: SavingsGoal) => void;
    onAllocate: (goal: SavingsGoal) => void;
    onDelete: (goal: SavingsGoal) => void;
}

export const SavingsGoalCard = forwardRef<HTMLDivElement, SavingsGoalCardProps>(({ goal, onEdit, onAllocate, onDelete }, ref) => {
    const { toggleGoalCompletion } = useSavings();
    const { settings } = useSettings();
    const currencySymbol = getCurrencySymbol(settings.currency);

    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const isTargetReached = goal.currentAmount >= goal.targetAmount;

    // Dynamic Icon
    const IconComponent = (Icons as any)[goal.icon] || Target;

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
        >
            <Card className={`overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow bg-card/50 backdrop-blur-sm ${goal.isCompleted ? 'opacity-75' : ''}`}>
                <div
                    className="h-2 w-full"
                    style={{ backgroundColor: goal.isCompleted ? '#10b981' : goal.color }}
                />
                <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm relative"
                                style={{
                                    backgroundColor: goal.isCompleted ? '#10b98120' : `${goal.color}20`,
                                    color: goal.isCompleted ? '#10b981' : goal.color
                                }}
                            >
                                <IconComponent className="w-5 h-5" />
                                {goal.isCompleted && (
                                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white dark:border-gray-900">
                                        <CheckCircle className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className={`font-semibold truncate max-w-[150px] ${goal.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{goal.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                    Target: {currencySymbol}{goal.targetAmount.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => onEdit(goal)}
                            >
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => onDelete(goal)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Saved</span>
                            <span className="font-bold">
                                {currencySymbol}{goal.currentAmount.toLocaleString()}
                                <span className="text-muted-foreground font-normal ml-1">
                                    ({progress.toFixed(0)}%)
                                </span>
                            </span>
                        </div>
                        <Progress
                            value={progress}
                            className="h-2"
                            indicatorColor={goal.isCompleted ? '#10b981' : goal.color}
                        />
                    </div>

                    <div className="flex gap-2">
                        {!goal.isCompleted && (
                            <Button
                                className="flex-1 gap-2"
                                variant="outline"
                                onClick={() => onAllocate(goal)}
                                disabled={isTargetReached}
                            >
                                <Plus className="w-4 h-4" />
                                {isTargetReached ? 'Target Reached' : 'Add Money'}
                            </Button>
                        )}

                        {isTargetReached && !goal.isCompleted && (
                            <Button
                                className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => toggleGoalCompletion(goal.id)}
                            >
                                <CheckCircle className="w-4 h-4" />
                                Complete
                            </Button>
                        )}

                        {goal.isCompleted && (
                            <Button
                                className="flex-1 gap-2"
                                variant="outline"
                                onClick={() => toggleGoalCompletion(goal.id)}
                            >
                                <RotateCcw className="w-4 h-4" />
                                Mark Incomplete
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
});

SavingsGoalCard.displayName = "SavingsGoalCard";
