import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { useBudget } from "@/contexts/BudgetContext";
import { useSubscriptions } from "@/contexts/SubscriptionContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Coins, ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CURRENCIES } from "@/constants/currencies";

export function CurrencySelector() {
    const { settings, updateSettings } = useSettings();
    const { convertExpenses } = useExpenses();
    const { convertBudgets } = useBudget();
    const { convertSubscriptions } = useSubscriptions();

    const [isOpen, setIsOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(settings.currency);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    const currentCurrency = CURRENCIES.find((c) => c.code === settings.currency) || CURRENCIES[0];

    const handleCurrencyChange = (value: string) => {
        setSelectedCurrency(value);
        setShowConfirmation(true);
    };

    const handleSignChangeOnly = () => {
        updateSettings({ ...settings, currency: selectedCurrency });
        setIsOpen(false);
        setShowConfirmation(false);
        toast.success(`Currency updated to ${selectedCurrency}`);
    };

    const handleConvertAmounts = async () => {
        setIsConverting(true);
        try {
            // Fetch exchange rate
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${settings.currency}`);
            if (!response.ok) throw new Error("Failed to fetch exchange rates");

            const data = await response.json();
            const rate = data.rates[selectedCurrency];

            if (!rate) throw new Error(`Exchange rate not found for ${selectedCurrency}`);

            // Convert all amounts
            convertExpenses(rate);
            convertBudgets(rate);
            convertSubscriptions(rate);

            // Update settings
            updateSettings({ ...settings, currency: selectedCurrency });

            setIsOpen(false);
            setShowConfirmation(false);
            toast.success(`Converted amounts from ${settings.currency} to ${selectedCurrency} (Rate: ${rate})`);
        } catch (error) {
            console.error("Conversion failed:", error);
            toast.error("Failed to convert amounts. Please try again or use 'Change Symbol Only'.");
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <>
            <div
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => setIsOpen(true)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                        <Coins className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium">Currency</span>
                        <span className="text-sm text-muted-foreground">
                            {currentCurrency.name} ({currentCurrency.symbol})
                        </span>
                    </div>
                </div>
                <Button variant="ghost" size="icon">
                    <ArrowRightLeft className="w-4 h-4" />
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={(open) => {
                if (!isConverting) {
                    setIsOpen(open);
                    if (!open) setShowConfirmation(false);
                }
            }}>
                <DialogContent className="sm:max-w-[500px] w-[90%] max-h-[85vh] overflow-y-auto rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Change Currency</DialogTitle>
                        <DialogDescription>
                            Select your preferred currency for tracking expenses.
                        </DialogDescription>
                    </DialogHeader>

                    {!showConfirmation ? (
                        <div className="py-4">
                            <Label>Select Currency</Label>
                            <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                                <SelectTrigger className="mt-2">
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
                    ) : (
                        <div className="py-4 space-y-4">
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <h4 className="font-medium text-yellow-600 mb-2">How should we handle existing amounts?</h4>
                                <p className="text-sm text-muted-foreground">
                                    You are changing from <strong>{settings.currency}</strong> to <strong>{selectedCurrency}</strong>.
                                </p>
                            </div>

                            <div className="grid gap-3">
                                <Button onClick={handleSignChangeOnly} variant="outline" className="justify-start h-auto py-3 px-4 whitespace-normal" disabled={isConverting}>
                                    <div className="text-left w-full">
                                        <div className="font-medium">Change Symbol Only</div>
                                        <div className="text-xs text-muted-foreground break-words">
                                            Keep numbers as is (e.g., {currentCurrency.symbol}100 becomes {CURRENCIES.find(c => c.code === selectedCurrency)?.symbol}100)
                                        </div>
                                    </div>
                                </Button>

                                <Button onClick={handleConvertAmounts} variant="outline" className="justify-start h-auto py-3 px-4 whitespace-normal" disabled={isConverting}>
                                    <div className="text-left flex items-start gap-2 w-full">
                                        {isConverting ? (
                                            <Loader2 className="w-4 h-4 animate-spin mt-1 shrink-0" />
                                        ) : null}
                                        <div className="w-full">
                                            <div className="font-medium">Convert Amounts</div>
                                            <div className="text-xs text-muted-foreground break-words">
                                                Convert values using current rates (e.g., {currentCurrency.symbol}100 becomes {CURRENCIES.find(c => c.code === selectedCurrency)?.symbol}??)
                                            </div>
                                        </div>
                                    </div>
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
