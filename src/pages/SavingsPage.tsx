import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBudget } from "@/contexts/BudgetContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useSavings, SavingsGoal } from "@/contexts/SavingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import { PiggyBank, ArrowLeft, Calendar, Plus, Target } from "lucide-react";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SavingsGoalCard } from "@/components/savings/SavingsGoalCard";
import { AddGoalModal } from "@/components/savings/AddGoalModal";
import { AllocateSavingsModal } from "@/components/savings/AllocateSavingsModal";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Skeleton } from "@/components/ui/skeleton";

export default function SavingsPage() {
    const navigate = useNavigate();
    const { state: budgetState } = useBudget();
    const { getTotalByType, state: expenseState } = useExpenses();
    const { settings } = useSettings();
    const { state: savingsState, deleteGoal, refreshSavings } = useSavings();
    const currencySymbol = getCurrencySymbol(settings.currency);

    const isLoading = budgetState.isLoading || expenseState.isLoading || savingsState.isLoading;

    const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
    const [allocatingGoal, setAllocatingGoal] = useState<SavingsGoal | null>(null);
    const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

    useEffect(() => {
        refreshSavings();
    }, []);

    const savingsHistory = budgetState.budgets
        .filter(b => b.surplusAction === 'saved')
        .map(b => {
            const expenses = getTotalByType("expense", b.month);
            const savedAmount = Math.max(0, b.total - expenses);
            return {
                month: b.month,
                amount: savedAmount
            };
        })
        .sort((a, b) => b.month.localeCompare(a.month));

    const totalAccumulatedSavings = savingsHistory.reduce((sum, item) => sum + item.amount, 0);
    const totalAllocated = savingsState.goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const availableSavings = Math.max(0, totalAccumulatedSavings - totalAllocated);

    const filteredGoals = savingsState.goals.filter(goal => {
        if (activeTab === 'pending') return !goal.isCompleted;
        if (activeTab === 'completed') return goal.isCompleted;
        return true;
    });

    const handleEditGoal = (goal: SavingsGoal) => {
        setEditingGoal(goal);
        setIsAddGoalOpen(true);
    };

    const handleAllocate = (goal: SavingsGoal) => {
        setAllocatingGoal(goal);
    };

    const handleDeleteClick = (goal: SavingsGoal) => {
        setGoalToDelete(goal);
    };

    const confirmDelete = () => {
        if (goalToDelete) {
            deleteGoal(goalToDelete.id);
            setGoalToDelete(null);
        }
    };

    const handleCloseAddGoal = () => {
        setIsAddGoalOpen(false);
        setEditingGoal(null);
    };

    return (
        <div className="bg-background p-4 sm:p-6 pb-24">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">My Savings</h1>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                            <img
                                src="/assets/token.png"
                                alt="Loading..."
                                className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
                            />
                        </div>
                        <p className="text-muted-foreground animate-pulse font-medium">Loading savings...</p>
                    </div>
                ) : (
                    <>
                        {/* Savings Overview Cards */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 overflow-hidden relative h-full">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <PiggyBank className="w-32 h-32 text-emerald-500" />
                                    </div>
                                    <CardHeader className="pb-2 relative z-10">
                                        <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                            <PiggyBank className="w-4 h-4" />
                                            Total Accumulated
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                                            {currencySymbol}{totalAccumulatedSavings.toFixed(2)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 overflow-hidden relative h-full">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Target className="w-32 h-32 text-blue-500" />
                                    </div>
                                    <CardHeader className="pb-2 relative z-10">
                                        <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
                                            <Target className="w-4 h-4" />
                                            Available to Allocate
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                                            {currencySymbol}{availableSavings.toFixed(2)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Savings Goals Section */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Target className="w-5 h-5 text-muted-foreground" />
                                    Savings Goals
                                </h2>
                                <Button size="sm" onClick={() => setIsAddGoalOpen(true)} className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    New Goal
                                </Button>
                            </div>

                            {/* Tabs */}
                            <div className="flex p-1 bg-muted/50 rounded-lg w-full sm:w-fit">
                                {(['all', 'pending', 'completed'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${activeTab === tab
                                            ? 'bg-background shadow-sm text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <AnimatePresence mode="popLayout">
                                    {filteredGoals.map((goal) => (
                                        <SavingsGoalCard
                                            key={goal.id}
                                            goal={goal}
                                            onEdit={handleEditGoal}
                                            onAllocate={handleAllocate}
                                            onDelete={handleDeleteClick}
                                        />
                                    ))}
                                </AnimatePresence>

                                {filteredGoals.length === 0 && (
                                    <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                                        <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No {activeTab === 'all' ? '' : activeTab} savings goals found</p>
                                        {activeTab !== 'completed' && (
                                            <Button variant="link" onClick={() => setIsAddGoalOpen(true)}>
                                                Create a new goal
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* History List */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                Savings History
                            </h2>

                            {savingsHistory.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8 text-center text-muted-foreground">
                                        No savings history yet. Keep under budget to start saving!
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-3">
                                    {savingsHistory.map((item, index) => (
                                        <motion.div
                                            key={item.month}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card>
                                                <CardContent className="flex justify-between items-center p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                            <PiggyBank className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{dayjs(item.month).format("MMMM YYYY")}</p>
                                                            <p className="text-xs text-muted-foreground">Monthly Surplus</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        +{currencySymbol}{item.amount.toFixed(2)}
                                                    </span>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <AddGoalModal
                isOpen={isAddGoalOpen}
                onClose={handleCloseAddGoal}
                editingGoal={editingGoal}
            />

            <AllocateSavingsModal
                isOpen={!!allocatingGoal}
                onClose={() => setAllocatingGoal(null)}
                goal={allocatingGoal}
                availableSavings={availableSavings}
            />

            <AlertDialog open={!!goalToDelete} onOpenChange={() => setGoalToDelete(null)}>
                <AlertDialogContent className="rounded-2xl sm:rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Savings Goal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{goalToDelete?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
