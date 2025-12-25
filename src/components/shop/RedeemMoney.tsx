import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGamification } from "@/contexts/GamificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext"; // Import useSettings
import { Wallet, Loader2, History } from "lucide-react";
import { toast } from "sonner";
import emailjs from "@emailjs/browser";

const PAYMENT_METHODS = [
    { id: "google_play", name: "Google Play Gift Card", image: "/assets/payment/google_play.png", color: "" },
    { id: "amazon", name: "Amazon Gift Card", image: "/assets/payment/amazon.png", color: "" },
    { id: "flipkart", name: "Flipkart Gift Card", image: "/assets/payment/flipkart.png?v=3", color: "" },
    { id: "paytm", name: "Paytm Gift Voucher", image: "/assets/payment/paytm_voucher.png", color: "" },
];

const BASE_AMOUNTS = [
    { value: 100, coins: 10000 },
    { value: 250, coins: 25000 },
    { value: 500, coins: 50000 },
    { value: 1000, coins: 100000 },
];

export function RedeemMoney() {
    const { user } = useAuth();
    const { state: gamifyState, spendCoins, addRedemptionLog, showSuccessAnimation } = useGamification();
    const { settings } = useSettings(); // Use settings
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [selectedAmount, setSelectedAmount] = useState<typeof BASE_AMOUNTS[0] | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "" });

    // Currency Conversion helper
    const currencyDetails = useMemo(() => {
        const curr = settings.currency || "USD";
        // Check if currency is a symbol ($) or Code (USD)
        const isUSD = curr === "USD" || curr === "$";
        const isEUR = curr === "EUR" || curr === "€";
        const isGBP = curr === "GBP" || curr === "£";
        const isINR = curr === "INR" || curr === "₹";

        let rate = 1;
        let symbol = "₹";

        if (isUSD) { rate = 0.012; symbol = "$"; }
        else if (isEUR) { rate = 0.011; symbol = "€"; }
        else if (isGBP) { rate = 0.0095; symbol = "£"; }
        else { rate = 1; symbol = "₹"; }

        return { rate, symbol };

    }, [settings.currency]);

    const getDisplayAmount = (baseValue: number) => {
        const val = baseValue * currencyDetails.rate;
        // Format nicely
        return Number.isInteger(val) ? val : val.toFixed(2);
    };

    // Pre-fill fields
    useMemo(() => {
        if (settings.userName) {
            setFormData(prev => ({ ...prev, name: settings.userName }));
        }
    }, [settings.userName]);

    const handleRedeemClick = (amount: typeof BASE_AMOUNTS[0]) => {
        if (!selectedMethod) {
            toast.error("Please select a payment method first");
            return;
        }
        if (gamifyState.coins < amount.coins) {
            toast.error(`You need ${amount.coins} tokens to redeem ${currencyDetails.symbol}${getDisplayAmount(amount.value)}`);
            return;
        }
        setSelectedAmount(amount);
        setFormData(prev => ({
            ...prev,
            email: user?.email || "",
            name: settings.userName || prev.name
        }));
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            toast.error("Please fill in all fields");
            return;
        }

        if (!selectedAmount) return;

        setIsLoading(true);

        try {
            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
            const templateId = import.meta.env.VITE_EMAILJS_REDEMPTION_TEMPLATE_ID;
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

            if (!serviceId || !templateId || !publicKey) {
                toast.error("Configuration Error: Missing EmailJS keys. Please contact support.");
                console.error("Missing EmailJS env keys");
                return;
            }

            const displayValue = `${currencyDetails.symbol}${getDisplayAmount(selectedAmount.value)}`;

            const commonParams = {
                user_email: formData.email,
                user_name: formData.name,
                amount: displayValue, // Send formatted amount with symbol
                base_amount_inr: selectedAmount.value, // Keep track of base INR value
                tokens_spent: selectedAmount.coins, // Renamed for clarity in email template if needed, but keeping keys safe or just label
                payment_method: PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name,
                currency: settings.currency, // Send currency info
                date: new Date().toLocaleString(),
            };

            const adminParams = {
                ...commonParams,
                to_email: "bl.ruchith@gmail.com",
            };

            const userParams = {
                ...commonParams,
                to_email: formData.email,
            };

            try {
                await emailjs.send(serviceId, templateId, adminParams, publicKey);
            } catch (error: any) {
                console.error("Failed to send admin email:", error);
                throw error;
            }

            try {
                await emailjs.send(serviceId, templateId, userParams, publicKey);
            } catch (error: any) {
                console.error("Failed to send user email:", error);
                toast.warning("Could not send user receipt, but redemption is processing.");
            }

            if (await spendCoins(selectedAmount.coins)) {
                addRedemptionLog({
                    amount: Number(selectedAmount.value), // Keep numerical value for DB/Log as base (or store string in future)
                    coins: selectedAmount.coins,
                    upiId: formData.name, // Use name instead of phone
                    status: 'completed'
                });

                setIsDialogOpen(false);
                setFormData({ name: "", email: "" });
                setSelectedAmount(null);
                setSelectedMethod(null);

                showSuccessAnimation({
                    type: 'redemption',
                    item: `${currencyDetails.symbol}${getDisplayAmount(selectedAmount.value)} Gift Card`
                });

                toast.success("Redemption Successful!", {
                    description: "Your money will be credited within 3-7 working days.",
                    duration: 5000,
                });
            }
        } catch (error: any) {
            console.error("Redemption failed:", error);
            if (error.text) {
                console.error("EmailJS Error Text:", error.text);
            }
            if (error.status) {
                console.error("EmailJS Error Status:", error.status);
            }
            toast.error("Redemption Failed", {
                description: `Error: ${error.text || "There was an error processing your request. Please try again."}`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">

                        Redeem Gift Cards
                    </CardTitle>
                    <CardDescription>
                        Convert your Earned tokens into gift cards. Rate: 100 Tokens = {currencyDetails.symbol}{getDisplayAmount(1)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Payment Methods */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground">Select Gift card Type</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {PAYMENT_METHODS.map((method) => (
                                <Button
                                    key={method.id}
                                    variant={selectedMethod === method.id ? "default" : "outline"}
                                    className={`h-auto min-h-[6rem] py-3 flex flex-col gap-2 whitespace-normal text-center ${selectedMethod === method.id ? "" : "hover:border-primary/50"}`}
                                    onClick={() => setSelectedMethod(method.id)}
                                >
                                    <div className="w-12 h-12 relative flex items-center justify-center rounded-lg overflow-hidden">
                                        <img
                                            src={method.image}
                                            alt={method.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className="text-xs">{method.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Amounts */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground">Select Amount</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {BASE_AMOUNTS.map((amount) => (
                                <Button
                                    key={amount.value}
                                    variant="outline"
                                    className="h-24 flex flex-col gap-1 relative overflow-hidden group"
                                    onClick={() => handleRedeemClick(amount)}
                                    disabled={!selectedMethod}
                                >
                                    <span className="text-2xl font-bold">{currencyDetails.symbol}{getDisplayAmount(amount.value)}</span>
                                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                        {amount.coins.toLocaleString()} Tokens
                                    </span>
                                    {gamifyState.coins >= amount.coins && (
                                        <div className="absolute top-0 right-0 p-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                        </div>
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground pt-4 border-t">
                        <i><b>Disclaimer:</b> Gift cards and vouchers are digital rewards provided by us, not cash withdrawals. For approval it will take 1-2 working days. Rewards are subject to availability.</i>
                    </p>
                </CardContent>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Complete Redemption</DialogTitle>
                            <DialogDescription>
                                Redeeming {currencyDetails.symbol}{getDisplayAmount(selectedAmount?.value || 0)} for {selectedAmount?.coins.toLocaleString()} tokens via {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    disabled
                                />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Confirm Redemption"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </Card>

            {/* Redemption History */}
            {gamifyState.redemptionHistory && gamifyState.redemptionHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <History className="w-5 h-5 text-blue-500" />
                            Redemption History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {gamifyState.redemptionHistory.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            {/* Note: History logs allow historical currency or current? Simple is assuming base INR for history or just checking if we logged formatted string. We logged amount number. So it displays in base units or we assume INR */}
                                            <span className="font-bold">₹{log.amount}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 capitalize">
                                                {log.status}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(log.date).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-sm font-medium text-red-500">-{log.coins.toLocaleString()} Tokens</span>
                                        <span className="text-xs text-muted-foreground">{log.upiId}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
