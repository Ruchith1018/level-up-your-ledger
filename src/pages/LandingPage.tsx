import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, Zap, Sparkles, TrendingUp, Users } from "lucide-react";
import { PaymentRegistrationDialog } from "@/components/payment/PaymentRegistrationDialog";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
    const navigate = useNavigate();
    const { loading } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium' | null>(null);
    const [minLoading, setMinLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setMinLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (loading || minLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                    <img
                        src="/assets/token.png"
                        alt="Loading..."
                        className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
                    />
                </div>
                <p className="text-muted-foreground animate-pulse font-medium">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Navbar */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span>BudGlio</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate("/auth")}>Login</Button>
                        <Button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                            Get Started
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 px-4 text-center space-y-6 container mx-auto">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                    Level Up Your <span className="text-primary">Ledger</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Gamify your finances, track every penny, and join a community of smart savers.
                    Experience the most engaging way to manage your money.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <Button size="lg" className="h-12 px-8 text-lg" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                        Start Your Journey
                    </Button>

                </div>
            </section>

            {/* Features Grid */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">Why BudGlio?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="w-10 h-10 text-yellow-500" />}
                            title="Gamified Finance"
                            description="Earn XP, unlock badges, and climb the leaderboard as you save money."
                        />
                        <FeatureCard
                            icon={<Shield className="w-10 h-10 text-blue-500" />}
                            title="Secure Saving"
                            description="Bank-grade encryption keeps your financial data safe and private."
                        />
                        <FeatureCard
                            icon={<Users className="w-10 h-10 text-green-500" />}
                            title="Family Tracking"
                            description="Manage household finances together with shared budgets and goals."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 px-4 container mx-auto">
                <h2 className="text-3xl font-bold text-center mb-4">Choose Your Path</h2>
                <p className="text-center text-muted-foreground mb-12">One-time payment. Lifetime access.</p>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Standard Plan */}
                    <Card className="relative border-2 hover:border-primary transition-colors cursor-pointer" onClick={() => setSelectedPlan('standard')}>
                        <CardHeader>
                            <CardTitle className="text-2xl">Standard Agent</CardTitle>
                            <CardDescription>Everything you need to start tracking.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-4xl font-bold">₹99</div>
                            <ul className="space-y-2">
                                <CheckItem text="Unlimited Transactions" />
                                <CheckItem text="Basic Budgeting" />
                                <CheckItem text="Family Features" />
                                <CheckItem text="Standard Themes" />
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant="outline">Select Standard</Button>
                        </CardFooter>
                    </Card>

                    {/* Premium Plan */}
                    <Card className="relative border-2 border-primary shadow-lg scale-105 bg-card" onClick={() => setSelectedPlan('premium')}>
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Most Popular
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl">Elite Agent</CardTitle>
                            <CardDescription>Unlock the full potential of your ledger.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-4xl font-bold">₹249</div>
                            <ul className="space-y-2">
                                <CheckItem text="Everything in Standard" />
                                <CheckItem text="Premium Themes Pack" />
                                <CheckItem text="Exclusive Card Skins" />
                                <CheckItem text="Priority Support" />
                                <CheckItem text="Founder Badge" />
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full">Select Elite</Button>
                        </CardFooter>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-muted-foreground text-sm border-t">
                © {new Date().getFullYear()} BudGlio. All rights reserved.
            </footer>

            {/* Registration Dialog */}
            <PaymentRegistrationDialog
                open={!!selectedPlan}
                onOpenChange={(open) => !open && setSelectedPlan(null)}
                planType={selectedPlan || 'standard'}
                price={selectedPlan === 'premium' ? 249 : 99}
                title={selectedPlan === 'premium' ? 'Elite Agent' : 'Standard Agent'}
            />
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <Card className="border-none shadow-none bg-transparent text-center">
        <CardContent className="pt-6 flex flex-col items-center gap-4">
            {icon}
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const CheckItem = ({ text }: { text: string }) => (
    <li className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary rounded-full p-1">
            <Check className="w-3 h-3" />
        </div>
        <span>{text}</span>
    </li>
);

export default LandingPage;
