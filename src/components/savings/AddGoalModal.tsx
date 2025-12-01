import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavingsGoal, useSavings } from "@/contexts/SavingsContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import * as Icons from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingGoal?: SavingsGoal | null;
}

const COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f97316", // Orange
];

const ICONS = [
    "Target", "Car", "Home", "Plane", "Smartphone", "Laptop",
    "GraduationCap", "Heart", "Gift", "Gamepad2", "Bike", "Music"
];

export function AddGoalModal({ isOpen, onClose, editingGoal }: AddGoalModalProps) {
    const { addGoal, updateGoal } = useSavings();
    const { settings } = useSettings();
    const currencySymbol = getCurrencySymbol(settings.currency);

    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [color, setColor] = useState(COLORS[0]);
    const [icon, setIcon] = useState(ICONS[0]);

    useEffect(() => {
        if (editingGoal) {
            setName(editingGoal.name);
            setTargetAmount(editingGoal.targetAmount.toString());
            setColor(editingGoal.color);
            setIcon(editingGoal.icon);
        } else {
            setName("");
            setTargetAmount("");
            setColor(COLORS[0]);
            setIcon(ICONS[0]);
        }
    }, [editingGoal, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !targetAmount) return;

        const goalData = {
            name,
            targetAmount: parseFloat(targetAmount),
            color,
            icon,
        };

        if (editingGoal) {
            updateGoal({ ...editingGoal, ...goalData });
        } else {
            addGoal(goalData);
        }

        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl sm:rounded-3xl">
                <DialogHeader>
                    <DialogTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Goal Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. New Car"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="target">Target Amount ({currencySymbol})</Label>
                        <Input
                            id="target"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`w-8 h-8 rounded-full transition-transform ${color === c ? "scale-110 ring-2 ring-offset-2 ring-primary" : "hover:scale-105"}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <ScrollArea className="h-[100px] w-full rounded-md border p-2">
                            <div className="grid grid-cols-6 gap-2">
                                {ICONS.map((iconName) => {
                                    const Icon = (Icons as any)[iconName];
                                    return (
                                        <button
                                            key={iconName}
                                            type="button"
                                            className={`p-2 rounded-md flex items-center justify-center transition-colors ${icon === iconName ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                            onClick={() => setIcon(iconName)}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">{editingGoal ? "Save Changes" : "Create Goal"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
