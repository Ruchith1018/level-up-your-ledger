import { useState, useEffect } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/constants/currencies";
import { Budget } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, AlertCircle, Pencil } from "lucide-react";
import dayjs from "dayjs";

import { Checkbox } from "@/components/ui/checkbox";

interface CategoryLimit {
    category: string;
    limit: number;
}

interface BudgetFormProps {
    trigger?: React.ReactNode;
    initialData?: Budget;
}

export function BudgetForm({ trigger, initialData }: BudgetFormProps) {
    const { addBudget, updateBudget } = useBudget();
    const { settings } = useSettings();
    const currencySymbol = getCurrencySymbol(settings.currency);
    const [open, setOpen] = useState(false);
    const [totalBudget, setTotalBudget] = useState<string>("");
    const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([
        { category: "", limit: 0 },
    ]);
    const [rollover, setRollover] = useState(true);
    const [errors, setErrors] = useState<string[]>([]);

    const currentMonth = dayjs().format("YYYY-MM");
    const isEditing = !!initialData;

    useEffect(() => {
        if (open && initialData) {
            setTotalBudget(initialData.total.toString());
            const limits = Object.entries(initialData.categoryLimits).map(
                ([category, limit]) => ({
                    category,
                    limit,
                })
            );
            setCategoryLimits(limits.length > 0 ? limits : [{ category: "", limit: 0 }]);
            setRollover(initialData.rollover ?? true);
        } else if (open && !initialData) {
            // Reset form when opening in create mode
            setTotalBudget("");
            setCategoryLimits([{ category: "", limit: 0 }]);
            setRollover(true);
            setErrors([]);
        }
    }, [open, initialData]);

    const handleAddCategory = () => {
        setCategoryLimits([...categoryLimits, { category: "", limit: 0 }]);
    };

    const handleRemoveCategory = (index: number) => {
        setCategoryLimits(categoryLimits.filter((_, i) => i !== index));
    };

    const handleCategoryChange = (index: number, field: keyof CategoryLimit, value: string | number) => {
        const updated = [...categoryLimits];
        if (field === "category") {
            updated[index][field] = value as string;
        } else {
            updated[index][field] = typeof value === "string" ? parseFloat(value) || 0 : value;
        }
        setCategoryLimits(updated);
    };

    const validateForm = (): boolean => {
        const newErrors: string[] = [];

        // Validate total budget
        const total = parseFloat(totalBudget);
        if (!totalBudget || isNaN(total) || total <= 0) {
            newErrors.push("Total budget must be greater than 0");
        }

        // Validate categories
        const categoryNames = categoryLimits
            .map((cl) => cl.category.trim())
            .filter((name) => name !== "");

        if (categoryNames.length === 0) {
            newErrors.push("Add at least one category with a budget limit");
        }

        // Check for duplicate category names
        const duplicates = categoryNames.filter(
            (name, index) => categoryNames.indexOf(name) !== index
        );
        if (duplicates.length > 0) {
            newErrors.push(`Duplicate category names: ${duplicates.join(", ")}`);
        }

        // Check if category limits exceed total budget
        const categorySum = categoryLimits
            .filter((cl) => cl.category.trim() !== "")
            .reduce((sum, cl) => sum + cl.limit, 0);

        if (categorySum > total) {
            newErrors.push(
                `Category limits (${currencySymbol}${categorySum.toFixed(2)}) exceed total budget (${currencySymbol}${total.toFixed(2)})`
            );
        }

        // Check for invalid category limits
        categoryLimits.forEach((cl, index) => {
            if (cl.category.trim() !== "" && cl.limit <= 0) {
                newErrors.push(`Category "${cl.category}" must have a limit greater than 0`);
            }
        });

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const total = parseFloat(totalBudget);
        const limits: Record<string, number> = {};

        categoryLimits
            .filter((cl) => cl.category.trim() !== "")
            .forEach((cl) => {
                limits[cl.category.trim()] = cl.limit;
            });

        if (isEditing && initialData) {
            updateBudget({
                ...initialData,
                total,
                categoryLimits: limits,
                rollover,
            });
        } else {
            addBudget({
                period: "monthly",
                month: currentMonth,
                total,
                categoryLimits: limits,
                rollover,
            });
        }

        // Reset form
        setTotalBudget("");
        setCategoryLimits([{ category: "", limit: 0 }]);
        setErrors([]);
        setOpen(false);
    };

    const handleCancel = () => {
        setTotalBudget("");
        setCategoryLimits([{ category: "", limit: 0 }]);
        setErrors([]);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant={isEditing ? "outline" : "default"} size={isEditing ? "icon" : "default"}>
                        {isEditing ? <Pencil className="w-4 h-4" /> : "Create Budget"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[90%] rounded-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Monthly Budget" : "Create Monthly Budget"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Update" : "Set"} your budget for {dayjs(initialData?.month || currentMonth).format("MMMM YYYY")}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Total Budget */}
                    <div className="space-y-2">
                        <Label htmlFor="totalBudget">Total Monthly Budget</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {currencySymbol}
                            </span>
                            <Input
                                id="totalBudget"
                                type="number"
                                step="0.01"
                                min="0"
                                value={totalBudget}
                                onChange={(e) => setTotalBudget(e.target.value)}
                                placeholder="5000.00"
                                className="pl-7"
                            />
                        </div>
                    </div>

                    {/* Category Limits */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Category Budget Limits</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddCategory}
                            >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Add Category
                            </Button>
                        </div>

                        {/* Category Suggestions */}
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Quick Add Categories:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    "Food & Dining",
                                    "Transportation",
                                    "Shopping",
                                    "Entertainment",
                                    "Bills & Utilities",
                                    "Health",
                                    "Education",
                                    "Travel",
                                    "Groceries",
                                    "Other",
                                ].map((suggestion) => {
                                    const isAlreadyAdded = categoryLimits.some(
                                        (cl) => cl.category.trim().toLowerCase() === suggestion.toLowerCase()
                                    );

                                    return (
                                        <Button
                                            key={suggestion}
                                            type="button"
                                            variant={isAlreadyAdded ? "secondary" : "outline"}
                                            size="sm"
                                            disabled={isAlreadyAdded}
                                            onClick={() => {
                                                // Find the first empty category slot or add a new one
                                                const emptyIndex = categoryLimits.findIndex((cl) => cl.category.trim() === "");
                                                if (emptyIndex !== -1) {
                                                    handleCategoryChange(emptyIndex, "category", suggestion);
                                                    // Focus on the amount input for this category
                                                    setTimeout(() => {
                                                        const amountInput = document.querySelectorAll('input[type="number"]')[emptyIndex + 1];
                                                        if (amountInput instanceof HTMLInputElement) {
                                                            amountInput.focus();
                                                        }
                                                    }, 100);
                                                } else {
                                                    // Add a new category with this suggestion
                                                    setCategoryLimits([...categoryLimits, { category: suggestion, limit: 0 }]);
                                                    // Focus on the amount input
                                                    setTimeout(() => {
                                                        const amountInputs = document.querySelectorAll('input[type="number"]');
                                                        const lastAmountInput = amountInputs[amountInputs.length - 1];
                                                        if (lastAmountInput instanceof HTMLInputElement) {
                                                            lastAmountInput.focus();
                                                        }
                                                    }, 100);
                                                }
                                            }}
                                            className="text-xs h-7"
                                        >
                                            {suggestion}
                                            {isAlreadyAdded && " ✓"}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {categoryLimits.map((cl, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Category name (e.g., Food & Dining)"
                                            value={cl.category}
                                            onChange={(e) =>
                                                handleCategoryChange(index, "category", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="w-32">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                {currencySymbol}
                                            </span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={cl.limit || ""}
                                                onChange={(e) =>
                                                    handleCategoryChange(index, "limit", e.target.value)
                                                }
                                                className="pl-7"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveCategory(index)}
                                        disabled={categoryLimits.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Category Sum Display */}
                        {categoryLimits.some((cl) => cl.category.trim() !== "") && (
                            <div className="flex justify-between text-sm p-3 bg-muted rounded-lg">
                                <span className="text-muted-foreground">Category Total:</span>
                                <span className="font-semibold">
                                    {currencySymbol}
                                    {categoryLimits
                                        .filter((cl) => cl.category.trim() !== "")
                                        .reduce((sum, cl) => sum + cl.limit, 0)
                                        .toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Errors */}
                    {errors.length > 0 && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-destructive font-medium">
                                <AlertCircle className="w-4 h-4" />
                                <span>Please fix the following errors:</span>
                            </div>
                            <ul className="list-disc list-inside text-sm text-destructive space-y-1">
                                {errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Rollover Checkbox */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="rollover"
                            checked={rollover}
                            onCheckedChange={(checked) => setRollover(checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="rollover"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Rollover unused budget
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Add remaining budget from this month to the next month
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button type="submit">{isEditing ? "Update Budget" : "Create Budget"}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
