import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { useBudget } from "@/contexts/BudgetContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import dayjs from "dayjs";
import { Sparkles, Target, Upload, Coins } from "lucide-react";
import { CURRENCIES } from "@/constants/currencies";

import { useTutorial } from "@/contexts/TutorialContext";
import { decryptData } from "@/utils/security";

export function OnboardingDialog() {
    const { settings, updateSettings } = useSettings();
    const { addBudget } = useBudget();
    const { startTutorial } = useTutorial();
    const [step, setStep] = useState(1);
    const [userName, setUserName] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [budgetAmount, setBudgetAmount] = useState("");

    const isOpen = !settings.hasCompletedOnboarding;

    const handleNameSubmit = () => {
        if (!userName.trim()) {
            toast.error("Please enter your name");
            return;
        }
        setStep(2);
    };

    const handleCurrencySubmit = () => {
        if (!currency) {
            toast.error("Please select a currency");
            return;
        }
        updateSettings({ ...settings, currency });
        setStep(3);
    };

    const handleCreateBudget = () => {
        const amount = parseFloat(budgetAmount);
        if (!amount || amount <= 0) {
            toast.error("Please enter a valid budget amount");
            return;
        }

        addBudget({
            period: "monthly",
            month: dayjs().format("YYYY-MM"),
            total: amount,
            categoryLimits: {},
            rollover: false,
        });

        completeOnboarding();
    };

    const handleSkipBudget = () => {
        completeOnboarding();
    };

    const completeOnboarding = () => {
        updateSettings({
            ...settings,
            userName: userName.trim(),
            currency: currency, // Ensure currency is saved
            hasCompletedOnboarding: true,
        });
        toast.success(`Welcome to FinanceQuest, ${userName}! 🎉`);
        startTutorial();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const fileContent = e.target?.result as string;
                let data;

                try {
                    data = decryptData(fileContent);
                } catch (error) {
                    throw new Error("Invalid encrypted file or wrong key");
                }

                if (!data.version || !data.expenses) throw new Error("Invalid file");

                localStorage.setItem("gft_expenses_v1", JSON.stringify({ items: data.expenses }));
                localStorage.setItem("gft_budgets_v1", JSON.stringify({ budgets: data.budgets || [] }));
                localStorage.setItem("gft_subscriptions_v1", JSON.stringify({ subscriptions: data.subscriptions || [] }));
                if (data.gamification) localStorage.setItem("gft_gamify_v1", JSON.stringify(data.gamification));
                if (data.purchasedThemes) localStorage.setItem("gft_purchased_themes", JSON.stringify(data.purchasedThemes));
                if (data.purchasedCards) localStorage.setItem("gft_purchased_card_themes", JSON.stringify(data.purchasedCards));

                const importedSettings = data.settings || {};
                const newSettings = {
                    ...settings,
                    ...importedSettings,
                    userName: importedSettings.userName || userName,
                    hasCompletedOnboarding: true
                };
                localStorage.setItem("gft_settings_v1", JSON.stringify(newSettings));

                toast.success("Data restored! Reloading...");
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                toast.error("Import failed: Invalid encrypted file");
            }
        };
        reader.readAsText(file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl" hideCloseButton>
                {step === 1 ? (
                    <>
                        <DialogHeader>
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                                </div>
                            </div>
                            <DialogTitle className="text-center text-2xl">Welcome to FinanceQuest!</DialogTitle>
                            <DialogDescription className="text-center">
                                Let's get started on your financial journey. First, what should we call you?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Your Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter your name"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleNameSubmit()}
                                    autoFocus
                                />
                            </div>
                            <Button onClick={handleNameSubmit} className="w-full" disabled={!userName.trim()}>
                                Continue
                            </Button>
                        </div>
                    </>
                ) : step === 2 ? (
                    <>
                        <DialogHeader>
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                    <Coins className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <DialogTitle className="text-center text-2xl">Select Currency</DialogTitle>
                            <DialogDescription className="text-center">
                                Choose the currency you want to use for tracking your finances.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((c) => (
                                            <SelectItem key={c.code} value={c.code}>
                                                {c.name} ({c.symbol})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleCurrencySubmit} className="w-full">
                                Continue
                            </Button>
                        </div>
                    </>
                ) : step === 3 ? (
                    <>
                        <DialogHeader>
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <DialogTitle className="text-center text-2xl">Restore Data?</DialogTitle>
                            <DialogDescription className="text-center">
                                Do you have a backup file from a previous session? You can restore it now.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".enc"
                                    onChange={handleImport}
                                    className="hidden"
                                    id="onboarding-import"
                                />
                                <label htmlFor="onboarding-import">
                                    <Button asChild variant="outline" className="w-full cursor-pointer h-24 flex flex-col gap-2 border-dashed">
                                        <span>
                                            <Upload className="w-8 h-8 text-muted-foreground" />
                                            <span className="text-sm font-medium">Click to Upload Backup (.enc)</span>
                                        </span>
                                    </Button>
                                </label>
                            </div>
                            <Button onClick={() => setStep(4)} className="w-full" variant="ghost">
                                No, Start Fresh
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                                    <Target className="w-8 h-8 text-primary-foreground" />
                                </div>
                            </div>
                            <DialogTitle className="text-center text-2xl">Set Your First Budget</DialogTitle>
                            <DialogDescription className="text-center">
                                How much do you want to budget for this month? (You can always change this later)
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="budget">Monthly Budget ({CURRENCIES.find(c => c.code === currency)?.symbol || currency})</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    placeholder="e.g., 2000"
                                    value={budgetAmount}
                                    onChange={(e) => setBudgetAmount(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleCreateBudget()}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSkipBudget} variant="outline" className="flex-1">
                                    Skip for Now
                                </Button>
                                <Button onClick={handleCreateBudget} className="flex-1" disabled={!budgetAmount}>
                                    Create Budget
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
