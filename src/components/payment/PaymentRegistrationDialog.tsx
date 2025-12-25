import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { load } from "@cashfreepayments/cashfree-js";
import { supabase } from "@/lib/supabase";

interface PaymentRegistrationDialogProps {
    planType: 'standard' | 'premium';
    price: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
}

export const PaymentRegistrationDialog = ({ planType, price, open, onOpenChange, title }: PaymentRegistrationDialogProps) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        referralId: ""
    });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Initialize Cashfree
            const cashfree = await load({ mode: "sandbox" });

            // 2. Create Order
            const { data: orderData, error: orderError } = await supabase.functions.invoke('create-cashfree-order', {
                body: {
                    amount: price * 100, // Send in paisa, backend divides by 100
                    currency: "INR",
                    customer_id: formData.email.replace(/[^a-zA-Z0-9]/g, '_'),
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_phone: formData.phone
                }
            });

            if (orderError || !orderData?.payment_session_id) {
                throw new Error(orderError?.message || "Failed to create order");
            }

            const orderId = orderData.order_id;

            // 3. Close the registration dialog BEFORE opening Cashfree modal
            // This prevents z-index conflicts making the Cashfree modal unclickable
            onOpenChange(false);
            setLoading(false);

            // 4. Start Checkout (now that our dialog is closed)
            const checkoutOptions = {
                paymentSessionId: orderData.payment_session_id,
                redirectTarget: "_modal",
            };

            const result = await cashfree.checkout(checkoutOptions);

            // 5. Handle payment result
            if (result.error) {
                toast.error("Payment failed or cancelled");
                return;
            }

            // 6. Payment completed, now create the user
            toast.loading("Creating your account...");

            const { data: userData, error: userError } = await supabase.functions.invoke('create-paid-user', {
                body: {
                    order_id: orderId,
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    plan_type: planType,
                    referral_code: formData.referralId
                }
            });

            if (userError || !userData?.success) {
                toast.dismiss();
                toast.error(userError?.message || userData?.error || "Registration failed");
                return;
            }

            toast.dismiss();
            toast.success("Account created! Logging you in...");

            // 7. Auto login
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            });

            if (loginError) {
                toast.error("Login failed. Please try logging in manually.");
                return;
            }

            // 8. Navigate to dashboard after successful login
            toast.success("Welcome! Redirecting to your dashboard...");
            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);

        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title} Registration</DialogTitle>
                    <DialogDescription>
                        Enter your details to create your account. You will be redirected to payment of ₹{price}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePayment} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="John Doe" required value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="john@example.com" required value={formData.email} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" type="tel" placeholder="9999999999" required value={formData.phone} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" required value={formData.password} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="referralId">Referral ID (Optional)</Label>
                        <Input id="referralId" placeholder="Enter referral code" value={formData.referralId} onChange={handleInputChange} />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Proceed to Pay ₹{price}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};
