import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";

interface PhoneRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (phone: string) => void;
    isLoading?: boolean;
}

export function PhoneRequestDialog({ open, onOpenChange, onConfirm, isLoading }: PhoneRequestDialogProps) {
    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");

    const handleConfirm = () => {
        if (!phone) {
            setError("Phone number is required");
            return;
        }

        // Basic validation for 10 digits
        if (!/^\d{10}$/.test(phone)) {
            setError("Please enter a valid 10-digit phone number");
            return;
        }

        onConfirm(phone);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Contact Details</DialogTitle>
                    <DialogDescription>
                        Please provide your phone number to proceed with the secure payment.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+91</span>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="9999999999"
                                className="pl-12"
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                                    setError("");
                                }}
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={isLoading || phone.length !== 10}>
                        {isLoading ? "Processing..." : "Proceed to Pay"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
