import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavingsGoal, useSavings } from "@/contexts/SavingsContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";

interface AllocateSavingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: SavingsGoal | null;
    availableSavings: number;
}

export function AllocateSavingsModal({ isOpen, onClose, goal, availableSavings }: AllocateSavingsModalProps) {
    const { allocateSavings } = useSavings();
    const { settings } = useSettings();
    const currencySymbol = getCurrencySymbol(settings.currency);

    const [amount, setAmount] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!goal || !amount) return;

        const numAmount = parseFloat(amount);
        if (numAmount <= 0 || numAmount > availableSavings) return;

        allocateSavings(goal.id, numAmount);
        setAmount("");
        onClose();
    };

    if (!goal) return null;

    const remainingNeeded = goal.targetAmount - goal.currentAmount;
    const maxAllocatable = Math.min(availableSavings, remainingNeeded);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl sm:rounded-3xl">
                <DialogHeader>
                    <DialogTitle>Add Money to {goal.name}</DialogTitle>
                    <DialogDescription>
                        Available Savings: {currencySymbol}{availableSavings.toFixed(2)}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount to Add ({currencySymbol})</Label>
                        <Input
                            id="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            max={maxAllocatable}
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Max you can add: {currencySymbol}{maxAllocatable.toFixed(2)}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={!amount || parseFloat(amount) > maxAllocatable}>
                            Add Money
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
