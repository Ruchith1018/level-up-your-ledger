import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" /> Back
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                    <p>Last updated: December 19, 2025</p>

                    <h3 className="text-xl font-semibold text-foreground">1. Introduction</h3>
                    <p>
                        Welcome to Level Up Your Ledger. By using our application, you agree to these Terms and Conditions.
                        Please read them carefully.
                    </p>

                    <h3 className="text-xl font-semibold text-foreground">2. User Accounts</h3>
                    <p>
                        You are responsible for maintaining the confidentiality of your account credentials and for all activities
                        that occur under your account.
                    </p>

                    <h3 className="text-xl font-semibold text-foreground">3. Privacy</h3>
                    <p>
                        Your privacy is important to us. We collect minimal data necessary to provide our services.
                        Your financial data is stored securely.
                    </p>

                    <h3 className="text-xl font-semibold text-foreground">4. Gamification & Rewards</h3>
                    <p>
                        Coins and XP earned in the application have no real-world monetary value unless explicitly stated
                        in specific redemption programs. Redemption offers are subject to availability and change.
                    </p>

                    <h3 className="text-xl font-semibold text-foreground">5. Termination</h3>
                    <p>
                        We reserve the right to terminate or suspend access to our service immediately, without prior notice,
                        for any breach of these Terms.
                    </p>

                    <h3 className="text-xl font-semibold text-foreground">6. Changes to Terms</h3>
                    <p>
                        We reserve the right to modify these terms at any time. We will notify users of any significant changes.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
