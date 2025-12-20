import { useState, useEffect } from "react";
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
import { Sparkles, Target, Coins, Plus, X } from "lucide-react";
import { CURRENCIES } from "@/constants/currencies";
import { DEFAULT_CATEGORIES } from "@/constants/categories";

import { useAuth } from "@/contexts/AuthContext";
import { useTutorial } from "@/contexts/TutorialContext";
import { decryptData } from "@/utils/security";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, User } from "lucide-react";

export function OnboardingDialog() {
    const { settings, updateSettings, isLoading } = useSettings();
    const { addBudget } = useBudget();
    const { startTutorial } = useTutorial();
    const { user } = useAuth();
    const [step, setStep] = useState(settings.hasAcceptedTerms ? 1 : 0); // Start at step 0 for Terms, or 1 if already accepted
    const [userName, setUserName] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [budgetAmount, setBudgetAmount] = useState("");
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termsUrl, setTermsUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // Category State
    const [categories, setCategories] = useState<{ name: string, limit: number }[]>([]);
    const [categorySelect, setCategorySelect] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [newLimit, setNewLimit] = useState("");

    useEffect(() => {
        if (settings.hasAcceptedTerms && step === 0) {
            setStep(1);
        }
    }, [settings.hasAcceptedTerms, step]);

    useEffect(() => {
        const fetchTermsUrl = async () => {
            try {
                console.log("Fetching terms URL...");
                // Using direct fetch to ensure we hit the correct endpoint
                const response = await fetch('https://lsjqmpdoalkeirfhtraj.supabase.co/functions/v1/get-terms-link', {
                    method: 'GET',
                });

                if (!response.ok) {
                    throw new Error(`Function returned ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log("Terms URL fetch result:", data);

                if (data?.url) {
                    setTermsUrl(data.url);
                } else {
                    console.warn("No URL returned from Edge Function");
                    setTermsUrl("#");
                    toast.error("Could not load Terms link. Please check console.");
                }
            } catch (error: any) {
                console.error("Failed to fetch terms URL:", error);
                setTermsUrl("#"); // Fallback
                toast.error(`Error loading Terms: ${error.message || "Unknown error"}`);
            }
        };

        if (step === 0 && !termsUrl) {
            fetchTermsUrl();
        }
    }, [step, termsUrl]);

    if (isLoading) return null;

    // Open if onboarding is incomplete OR terms are not accepted
    const isOpen = !settings.hasCompletedOnboarding || !settings.hasAcceptedTerms;

    const handleAddCategory = () => {
        const name = categorySelect === "custom" ? customCategory : categorySelect;

        if (!name?.trim()) {
            toast.error("Please select or enter a category name");
            return;
        }

        const limit = parseFloat(newLimit);
        const totalBudget = parseFloat(budgetAmount);

        if (!limit || limit <= 0) {
            toast.error("Please enter a valid limit amount");
            return;
        }

        const currentAllocated = categories.reduce((sum, cat) => sum + cat.limit, 0);
        if (currentAllocated + limit > totalBudget) {
            toast.warning(`Total exceeds monthly budget. Remaining: ${totalBudget - currentAllocated}`);
            return;
        }

        setCategories([...categories, { name: name.trim(), limit }]);
        setCategorySelect("");
        setCustomCategory("");
        setNewLimit("");
    };

    const handleRemoveCategory = (index: number) => {
        const newCats = [...categories];
        newCats.splice(index, 1);
        setCategories(newCats);
    };

    const handleTermsAccept = () => {
        if (!acceptedTerms) {
            toast.error("Please accept the terms and conditions");
            return;
        }
        updateSettings({ ...settings, hasAcceptedTerms: true }); // Persist acceptance
        setStep(1);
    };

    const handleNameSubmit = () => {
        if (!userName.trim()) {
            toast.error("Please enter your name");
            return;
        }
        // Update name immediately so it shows in the next step
        updateSettings({ ...settings, userName: userName.trim() });
        setStep(2);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        try {
            setIsUploading(true);

            // Delete old avatar if exists
            if (settings.profileImage && settings.profileImage.includes('avatars')) {
                try {
                    const oldPath = settings.profileImage.split('/').pop();
                    if (oldPath) {
                        await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
                    }
                } catch (e) { console.error(e); }
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            await updateSettings({ ...settings, profileImage: publicUrl });
            toast.success("Avatar uploaded!");
            // Optional: Auto-advance or let them click continue
        } catch (error: any) {
            toast.error(`Error uploading avatar: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCurrencySubmit = () => {
        if (!currency) {
            toast.error("Please select a currency");
            return;
        }
        updateSettings({ ...settings, currency });
        setStep(4);
    };

    const handleCreateBudget = () => {
        const amount = parseFloat(budgetAmount);
        if (!amount || amount <= 0) {
            toast.error("Please enter a valid budget amount");
            return;
        }

        if (categories.length === 0) {
            toast.error("Please add at least one category to your budget plan");
            return;
        }

        const categoryLimits: Record<string, number> = {};
        categories.forEach(cat => {
            categoryLimits[cat.name] = cat.limit;
        });

        addBudget({
            period: "monthly",
            month: dayjs().format("YYYY-MM"),
            total: amount,
            categoryLimits: categoryLimits,
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
        toast.success(`Welcome to BudGlio, ${userName}! 🎉`);
        startTutorial();
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl" hideCloseButton>
                {step === 0 ? (
                    <>
                        <DialogHeader>
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <DialogTitle className="text-center text-2xl">Terms of Service</DialogTitle>
                            <DialogDescription className="text-center">
                                Please review and accept our terms to continue.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="text-sm text-muted-foreground text-center">
                                By continuing, you acknowledge that you have read and agree to our{" "}
                                {termsUrl ? (
                                    <a
                                        href={termsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Terms and Conditions
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground cursor-wait">Terms and Conditions...</span>
                                )}
                                .
                            </div>

                            <div className="flex items-center space-x-2 justify-center p-4 bg-secondary/20 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                />
                                <Label htmlFor="terms" className="cursor-pointer">
                                    I accept the Terms and Conditions
                                </Label>
                            </div>

                            <Button onClick={handleTermsAccept} className="w-full" disabled={!acceptedTerms}>
                                Continue
                            </Button>
                        </div>
                    </>
                ) : step === 1 ? (
                    <>
                        <DialogHeader>
                            <div className="flex items-center justify-center mb-4">
                                <img src="/logo.jpg" alt="BudGlio Logo" className="w-16 h-16 rounded-2xl shadow-lg object-cover" />
                            </div>
                            <DialogTitle className="text-center text-2xl">Welcome to BudGlio!</DialogTitle>
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
                            <DialogTitle className="text-center text-2xl">Profile Picture</DialogTitle>
                            <DialogDescription className="text-center">
                                Add a face to the name! You can skip this if you'd like.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="flex justify-center">
                                <div className="relative group cursor-pointer w-32 h-32 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors">
                                    <Avatar className="w-full h-full">
                                        <AvatarImage src={settings.profileImage} alt={userName} className="object-cover" />
                                        <AvatarFallback className="text-4xl bg-muted">
                                            {userName ? userName.substring(0, 2).toUpperCase() : <User className="h-12 w-12 text-muted-foreground" />}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isUploading ? (
                                            <Loader2 className="h-8 w-8 animate-spin mb-1" />
                                        ) : (
                                            <Camera className="h-8 w-8 mb-1" />
                                        )}
                                        <span className="text-xs font-medium text-center px-2">
                                            {isUploading ? "Uploading..." : "Click to upload"}
                                        </span>
                                    </div>

                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button onClick={() => setStep(3)} className="w-full" disabled={isUploading}>
                                    {settings.profileImage ? "Continue" : "Skip for Now"}
                                </Button>
                                {settings.profileImage && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStep(3)}
                                        className="w-full"
                                        disabled={isUploading}
                                    >
                                        Skip
                                    </Button>
                                )}
                            </div>
                        </div>
                    </>
                ) : step === 3 ? (
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
                                Allocate your monthly budget to different categories.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="budget">Total Monthly Budget ({CURRENCIES.find(c => c.code === currency)?.symbol || currency})</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    placeholder="e.g., 2000"
                                    value={budgetAmount}
                                    onChange={(e) => setBudgetAmount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 pt-2 border-t">
                                <div className="flex justify-between text-sm">
                                    <Label>Add Categories</Label>
                                    <span className={((categories.reduce((sum, c) => sum + c.limit, 0) + (parseFloat(newLimit) || 0)) > parseFloat(budgetAmount)) ? "text-destructive" : "text-muted-foreground"}>
                                        Remaining: {CURRENCIES.find(c => c.code === currency)?.symbol}
                                        {Math.max(0, parseFloat(budgetAmount || "0") - categories.reduce((sum, c) => sum + c.limit, 0)).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-[2]">
                                        <Select
                                            value={categorySelect}
                                            onValueChange={(val) => setCategorySelect(val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DEFAULT_CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                                <SelectItem value="custom">Custom...</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {categorySelect === "custom" && (
                                            <Input
                                                placeholder="Custom Name"
                                                className="mt-2"
                                                value={customCategory}
                                                onChange={(e) => setCustomCategory(e.target.value)}
                                                autoFocus
                                            />
                                        )}
                                    </div>
                                    <Input
                                        type="number"
                                        placeholder="Limit"
                                        value={newLimit}
                                        onChange={(e) => setNewLimit(e.target.value)}
                                        className="flex-1"
                                        onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                                    />
                                    <Button onClick={handleAddCategory} size="icon" variant="secondary">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {categories.length > 0 && (
                                <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                                    {categories.map((cat, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-secondary/30 rounded-md text-sm">
                                            <span>{cat.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-muted-foreground">
                                                    {CURRENCIES.find(c => c.code === currency)?.symbol}{cat.limit}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRemoveCategory(idx)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2 mt-4">
                                <Button onClick={handleSkipBudget} variant="outline" className="flex-1">
                                    Skip for Now
                                </Button>
                                <Button onClick={handleCreateBudget} className="flex-1" disabled={!budgetAmount || categories.length === 0}>
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
