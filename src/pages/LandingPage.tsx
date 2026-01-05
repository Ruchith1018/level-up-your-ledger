import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, Zap, TrendingUp, Users, Smartphone, CreditCard, Menu, X, Star, Sparkles, Trophy, Sun, Moon } from "lucide-react";
import { PaymentRegistrationDialog } from "@/components/payment/PaymentRegistrationDialog";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { useNavigate } from "react-router-dom";
import { BenefitsGrid } from "@/components/landing/BenefitsGrid";
import { AnimatePresence, motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";
import { HeroDashboardPreview } from "@/components/landing/HeroDashboardPreview";
import { useSettings } from "@/contexts/SettingsContext";

const LandingPage = () => {
    const navigate = useNavigate();
    const { loading } = useAuth();
    const { settings, updateSettings } = useSettings();
    const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium' | null>(null);
    const [minLoading, setMinLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hidden, setHidden] = useState(false);
    const { scrollY } = useScroll();

    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const toggleTheme = () => {
        updateSettings({ theme: isDark ? 'light' : 'dark' });
    };

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() || 0;
        if (latest < 100) {
            setHidden(false);
        } else if (latest > previous + 5) {
            setHidden(true);
        } else if (latest < previous - 5) {
            setHidden(false);
        }
    });

    useEffect(() => {
        const timer = setTimeout(() => setMinLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setMobileMenuOpen(false);
        }
    };

    if (loading || minLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-6 bg-slate-950">
                <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
                    <img
                        src="/assets/token.png"
                        alt="Loading..."
                        className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
                    />
                </div>
                <p className="text-green-400 animate-pulse font-medium">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-green-500/30 font-sans transition-colors duration-300">
            {/* Fixed Full Width Navbar */}
            <motion.header
                initial={{ y: -100, x: 0, opacity: 0 }}
                animate={{
                    y: hidden ? -100 : 0,
                    x: 0,
                    opacity: hidden ? 0 : 1
                }}
                transition={{ duration: 0.3 }}
                className="fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-border/10 shadow-sm transition-colors duration-300"
            >
                <div className="w-full mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
                    {/* Logo Mobile/Desktop */}
                    <div
                        className="flex items-center gap-3 font-bold text-xl tracking-tight cursor-pointer shrink-0"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <img
                            src="/logo.jpg"
                            alt="BudGlio"
                            className="w-9 h-9 rounded-full object-cover shadow-lg shadow-green-500/20"
                        />
                        <span className="hidden md:inline bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-400">BudGlio</span>
                    </div>

                    {/* Desktop Split Nav */}
                    <nav className="hidden md:flex items-center gap-8 xl:gap-12 whitespace-nowrap">
                        {[
                            { label: 'Features', id: 'features' },
                            { label: 'Card Themes', id: 'card-themes' },
                            { label: 'Benefits', id: 'benefits' },
                            { label: 'Rewards', id: 'rewards' },
                            { label: 'Eligibility & Pricing', id: 'eligibility' }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className="text-sm xl:text-base font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 px-3 py-1.5 rounded-full transition-all duration-300"
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-muted-foreground hover:text-foreground"
                            onClick={toggleTheme}
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden md:flex text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-full px-4"
                            onClick={() => navigate("/auth")}
                        >
                            Login
                        </Button>
                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all font-medium"
                            onClick={() => scrollToSection('pricing')}
                        >
                            Start Saving
                        </Button>
                        <button className="md:hidden p-2 text-muted-foreground hover:bg-foreground/5 rounded-full" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </motion.header>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed inset-x-4 top-24 z-40 bg-background/95 dark:bg-slate-900/95 backdrop-blur-xl border border-border/10 rounded-3xl md:hidden flex flex-col p-6 space-y-2 shadow-2xl transition-colors duration-300"
                    >
                        {[
                            { label: 'Features', id: 'features' },
                            { label: 'Card Themes', id: 'card-themes' },
                            { label: 'Benefits', id: 'benefits' },
                            { label: 'Rewards', id: 'rewards' },
                            { label: 'Eligibility & Pricing', id: 'eligibility' }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-xl transition-colors"
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="pt-4 mt-2 border-t border-border/5 flex flex-col gap-3">
                            <Button variant="outline" className="w-full justify-center border-border/10 text-muted-foreground hover:bg-foreground/5 rounded-xl" onClick={() => navigate("/auth")}>Login</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* INTEGRATED SCROLL HERO */}
            {/* Render Hero Section only after loading is complete to ensure refs are hydrated */}
            <HeroIntro scrollToSection={scrollToSection} />
            <FeaturesSection />
            <div id="card-themes">
                <StickyScrollShowcase />
            </div>

            {/* Benefits Bento Grid Section */}
            <BenefitsGrid />

            {/* Partners/Rewards Section */}
            <section id="rewards" className="py-24 bg-background dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-6 text-foreground tracking-tight">Redeem Your Tokens</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Exchange your hard-earned tokens for real-world rewards. Shop your favorite brands directly from the app.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                        {/* Google Play */}
                        <div className="group relative overflow-hidden rounded-3xl p-4 aspect-square flex flex-col items-center justify-center text-center border border-border/10 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/20 bg-card dark:bg-slate-900 shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-green-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-foreground/5 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />

                            <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden p-1">
                                    <img src="/assets/payment/google_play.png" alt="Google Play" className="w-full h-full object-contain" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-lg font-bold text-foreground leading-tight">Google Play</h3>
                                    <p className="text-muted-foreground text-xs">Gift Card</p>
                                </div>
                            </div>
                        </div>

                        {/* Flipkart */}
                        <div className="group relative overflow-hidden rounded-3xl p-4 aspect-square flex flex-col items-center justify-center text-center border border-border/10 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-600/20 bg-card dark:bg-slate-900 shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-foreground/5 rounded-full blur-2xl group-hover:bg-blue-600/20 transition-colors" />

                            <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden p-1">
                                    <img src="/assets/payment/flipkart.png" alt="Flipkart" className="w-full h-full object-contain" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-lg font-bold text-foreground leading-tight">Flipkart</h3>
                                    <p className="text-muted-foreground text-xs">Gift Card</p>
                                </div>
                            </div>
                        </div>

                        {/* Amazon */}
                        <div className="group relative overflow-hidden rounded-3xl p-4 aspect-square flex flex-col items-center justify-center text-center border border-border/10 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-orange-500/20 bg-card dark:bg-slate-900 shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-foreground/5 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors" />

                            <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden p-1">
                                    <img src="/assets/payment/amazon.png" alt="Amazon" className="w-full h-full object-contain" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-lg font-bold text-foreground leading-tight">Amazon</h3>
                                    <p className="text-muted-foreground text-xs">Gift Card</p>
                                </div>
                            </div>
                        </div>

                        {/* Paytm */}
                        <div className="group relative overflow-hidden rounded-3xl p-4 aspect-square flex flex-col items-center justify-center text-center border border-border/10 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-cyan-500/20 bg-card dark:bg-slate-900 shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-foreground/5 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors" />

                            <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden p-1">
                                    <img src="/assets/payment/paytm_voucher.png" alt="Paytm" className="w-full h-full object-contain" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-lg font-bold text-foreground leading-tight">Paytm</h3>
                                    <p className="text-muted-foreground text-xs">Gift Card</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Usage Stats / Eligibility */}
            <section id="eligibility" className="py-24 bg-background dark:bg-slate-950 overflow-hidden transition-colors duration-300 relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">Who is BudGlio for?</h2>
                        <p className="text-xl text-muted-foreground font-light">If you relate to any of these, you're ready.</p>
                    </div>

                    <div className="bg-card/50 dark:bg-slate-900/50 border border-border/10 dark:border-white/5 rounded-[3rem] p-8 md:p-12 max-w-7xl mx-auto shadow-2xl backdrop-blur-sm relative overflow-hidden transition-colors duration-300">
                        {/* Inner Background Blob */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto relative z-10">
                            {/* 1. Animated Card (Where did it go?) */}
                            <AnimatedEligibilityCard />

                            {/* 2. Animated Card (Spreadsheet Fatigue) */}
                            <AnimatedSpreadsheetCard />

                            {/* 3. Animated Card (Money-Curious) */}
                            <AnimatedMoneyCuriousCard />

                            {/* 4. Animated Card (Competitive) */}
                            <AnimatedCompetitiveCard />

                            {/* 5. Animated Card (Save Not Stress) */}
                            <AnimatedSaveCard />
                        </div>
                        <div className="max-w-6xl mx-auto mt-12 relative z-10">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.6 }}
                                className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 border border-border/10 p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 min-h-[180px] shadow-2xl relative overflow-hidden group cursor-pointer transition-colors duration-300"
                                onClick={() => scrollToSection('pricing')}
                            >
                                {/* Background Glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[100px] group-hover:bg-green-500/20 transition-colors duration-500" />

                                <div className="relative z-10 text-center md:text-left">
                                    <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-white dark:text-slate-950 mb-2 transition-colors duration-300">
                                        Ready to Level Up?
                                    </h3>
                                    <p className="text-slate-400 dark:text-slate-500 text-lg md:text-xl font-light transition-colors duration-300">
                                        Join thousands of users mastering their money today.
                                    </p>
                                </div>

                                <div className="relative z-10 bg-white dark:bg-slate-950 text-slate-950 dark:text-white px-10 py-4 rounded-full font-bold text-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0">
                                    Get Started
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 px-4 bg-background dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-[120px]" />

                <div className="container mx-auto relative z-10">
                    <h2 className="text-4xl font-bold text-center mb-4 text-foreground">Choose Your Path</h2>
                    <p className="text-center text-muted-foreground mb-16 text-lg">Simple pricing. No hidden fees.</p>

                    <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
                        {/* Basic Plan - The "Anchor" */}
                        <Card
                            className={`relative h-full flex flex-col border-2 border-border/10 bg-card/30 dark:bg-slate-900/30 backdrop-blur-sm transition-all duration-500 cursor-pointer hover:border-border/30 hover:bg-card/50 md:scale-95 group ${selectedPlan === 'standard' ? 'border-green-500/30' : ''}`}
                            onClick={() => setSelectedPlan('standard')}
                        >
                            <CardHeader>
                                <CardTitle className="text-2xl text-foreground font-medium">Basic</CardTitle>
                                <CardDescription className="text-muted-foreground">The essentials to get you started.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 flex-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold text-foreground">₹99</span>
                                    <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">(One-time)</span>
                                </div>
                                <div className="h-px w-full bg-border/10 my-6" /> {/* Divider */}
                                <ul className="space-y-3">
                                    <CheckItem text="Unlimited Transactions" />
                                    <CheckItem text="Budgeting & Goal Tracking" />
                                    <CheckItem text="Detailed Analysis" />
                                    <CheckItem text="Themes, Cards" />
                                    <CheckItem text="Leaderboards" />
                                    <CheckItem text="Detailed Insights" />
                                    <CheckItem text="Basic Support" />
                                    <CheckItem text="Export to Document" />
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors py-6 text-lg" variant="ghost">Select Basic</Button>
                            </CardFooter>
                        </Card>

                        {/* Premium Plan - The "Star" */}
                        <Card
                            className={`relative h-full flex flex-col border-[3px] bg-slate-900 dark:bg-black text-white transition-all duration-500 transform cursor-pointer overflow-visible z-10 ${selectedPlan === 'premium' ? 'border-green-400 shadow-[0_0_50px_-12px_rgba(74,222,128,0.5)] scale-[1.02] md:scale-110' : 'border-green-500/50 shadow-2xl shadow-green-900/20 md:scale-105 hover:scale-[1.08]'}`}
                            onClick={() => setSelectedPlan('premium')}
                        >
                            {/* "Sticker" Badge */}
                            <div className="absolute -top-6 -right-6 bg-yellow-400 text-slate-900 px-6 py-2 rounded-lg font-black text-sm uppercase tracking-widest shadow-xl rotate-6 group-hover:rotate-12 transition-transform duration-300 flex items-center gap-2 z-20 border-2 border-slate-900">
                                <Star className="w-4 h-4 fill-slate-900" /> Best Value
                            </div>

                            <CardHeader className="pb-8">
                                <CardTitle className="text-4xl font-black tracking-tight text-white mb-2">Premium</CardTitle>
                                <CardDescription className="text-green-400 font-medium text-lg">For those who want to win.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 flex-1">
                                <div className="flex flex-col">
                                    <span className="text-2xl text-slate-400 font-bold line-through decoration-red-500 decoration-2 pl-1">₹499</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-7xl font-black tracking-tighter text-white">₹249</span>
                                        <span className="text-sm text-green-400/80 font-bold uppercase tracking-wider">(One-time)</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-lg font-medium">
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-slate-900"><Check className="w-4 h-4 stroke-[4]" /></div>
                                        <span>Everything in Basic</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-lg font-bold text-green-300">
                                        <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center text-slate-900"><Check className="w-4 h-4 stroke-[4]" /></div>
                                        <span>Family Tracking</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-lg font-bold text-yellow-300">
                                        <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900"><Star className="w-4 h-4 fill-slate-900" /></div>
                                        <span className="leading-tight">Custom Card & 3 Premium Cards <span className="text-xs opacity-80 block font-normal text-white">(free worth 500/-)</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-lg font-medium">
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-slate-900"><Check className="w-4 h-4 stroke-[4]" /></div>
                                        <span>Priority Support</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-8">
                                <Button className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-black text-xl py-8 rounded-2xl shadow-[0_10px_30px_-10px_rgba(34,197,94,0.6)] transform hover:-translate-y-1 transition-all duration-300">
                                    Get Premium Access
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-background dark:bg-slate-950 border-t border-border/10 transition-colors duration-300">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 font-bold text-2xl mb-6 opacity-80">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-foreground">BudGlio</span>
                    </div>
                    <div className="flex justify-center gap-8 mb-8 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-green-400 transition-colors">Terms</a>
                        <a href="#" className="hover:text-green-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-green-400 transition-colors">Contact</a>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        © {new Date().getFullYear()} BudGlio. All rights reserved. Made with 💚 for savers.
                    </p>
                </div>
            </footer>

            {/* Registration Dialog */}
            <PaymentRegistrationDialog
                open={!!selectedPlan}
                onOpenChange={(open) => !open && setSelectedPlan(null)}
                planType={selectedPlan || 'standard'}
                price={selectedPlan === 'premium' ? 249 : 99}
                title={selectedPlan === 'premium' ? 'Premium' : 'Basic'}
            />
        </div>
    );
};

function HeroIntro({ scrollToSection }: { scrollToSection: (id: string) => void }) {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center bg-background dark:bg-slate-950 overflow-hidden pt-32 pb-20 transition-colors duration-300">
            {/* --- Background Arc Effect --- */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[1000px] bg-background dark:bg-slate-950 rounded-[100%] border-b border-border/5 shadow-[0_20px_100px_rgba(22,163,74,0.15)] z-0 -mt-[600px] transition-colors duration-300" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[800px] bg-green-500/5 rounded-[100%] blur-3xl z-0 -mt-[500px] pointer-events-none" />

            {/* Content Container */}
            <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">



                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto space-y-8 mb-16"
                >
                    {/* Badge */}


                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.1] text-foreground">
                        Level Up Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 dark:from-green-400 dark:via-emerald-500 dark:to-green-600 animate-gradient-x"> Financial Legacy </span>
                        With <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 dark:from-green-400 dark:via-emerald-500 dark:to-green-600 animate-gradient-x"> BudGlio</span>

                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        The first expense tracker that treats your budget like a high-stakes game. Earn XP, unlock themes, and master your money.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                        <Button
                            className="h-14 px-10 text-lg rounded-full bg-green-600 hover:bg-green-500 text-white shadow-xl shadow-green-500/20 hover:shadow-green-500/40 transition-all transform hover:-translate-y-1 w-full sm:w-auto"
                            onClick={() => scrollToSection('pricing')}
                        >
                            Start Your Journey
                        </Button>
                        <Button
                            className="h-14 px-10 text-lg rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground border border-border/10 backdrop-blur-sm transition-all w-full sm:w-auto"
                            onClick={() => scrollToSection('features')}
                        >
                            Explore Features
                        </Button>
                    </div>
                </motion.div>

                {/* Dashboard Showcase (3D Perspective) */}
                <motion.div
                    initial={{ opacity: 0, y: 50, rotateX: 10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative w-full max-w-5xl mx-auto perspective-1000"
                >
                    <div className="relative transform transition-transform duration-700 hover:scale-[1.02]">


                        <HeroDashboardPreview />


                    </div>

                    {/* Ambience Glow under dashboard */}
                    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-green-500/20 blur-[100px] rounded-full pointer-events-none" />
                </motion.div>
            </div>
        </section>
    );
};

function FloatingTag({ text, icon, color, className }: { text: string, icon: React.ReactNode, color: string, className?: string }) {
    return (
        <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
            className={cn("items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md shadow-lg", color, className)}
        >
            {icon}
            <span className="text-sm font-semibold">{text}</span>
        </motion.div>
    );
}

function AnimatedEligibilityCard() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const content = [
        {
            title: (
                <>
                    The <span className="text-red-500 dark:text-red-400">"Where did it go?"</span><br />Syndrome
                </>
            )
        },
        {
            title: (
                <>
                    <span className="text-red-500 dark:text-red-400">"Mystery"</span> Subscription<br />Charges?
                </>
            )
        },
        {
            title: (
                <>
                    Month-End <br /><span className="text-red-500 dark:text-red-400">Wallet Panic?</span>
                </>
            )
        }
    ];

    return (
        <div className="md:col-span-7 bg-card dark:bg-white/5 border border-border/10 p-10 rounded-3xl flex items-center justify-center min-h-[240px] group hover:border-red-500/20 transition-all relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 text-center"
                >
                    <h3 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
                        {content[index].title}
                    </h3>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function AnimatedSpreadsheetCard() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        // Offset start time slightly (1s) to stagger 
        const timeout = setTimeout(() => {
            const timer = setInterval(() => {
                setIndex((prev) => (prev + 1) % 3);
            }, 5000);
            return () => clearInterval(timer);
        }, 1000);
        return () => clearTimeout(timeout);
    }, []);

    const content = [
        {
            title: (
                <>
                    Spreadsheet<br /><span className="line-through decoration-2 opacity-60">Fatigue</span>
                </>
            )
        },
        {
            title: (
                <>
                    Formula<br /><span className="text-red-500/80 font-mono">#REF! Errors</span>
                </>
            )
        },
        {
            title: (
                <>
                    Manual Entry<br /><span className="opacity-60">Burnout?</span>
                </>
            )
        }
    ];

    return (
        <div className="md:col-span-5 bg-card dark:bg-white/5 border border-border/10 p-10 rounded-3xl flex items-center justify-center min-h-[240px] group hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden">
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 text-center"
                >
                    <h3 className="text-2xl md:text-4xl font-bold text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                        {content[index].title}
                    </h3>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function AnimatedMoneyCuriousCard() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        // Offset start time (2s) to cascade 
        const timeout = setTimeout(() => {
            const timer = setInterval(() => {
                setIndex((prev) => (prev + 1) % 3);
            }, 5000);
            return () => clearInterval(timer);
        }, 2000);
        return () => clearTimeout(timeout);
    }, []);

    const content = [
        {
            title: (
                <>
                    Money-Curious<br />Mindset
                </>
            )
        },
        {
            title: (
                <>
                    Ready to<br /><span className="text-green-700 dark:text-green-400">Build Wealth?</span>
                </>
            )
        },
        {
            title: (
                <>
                    Breaking<br /><span className="text-green-700/80 dark:text-green-400/80">Old Habits?</span>
                </>
            )
        }
    ];

    return (
        <div className="md:col-span-5 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/10 p-10 rounded-3xl flex items-center justify-center min-h-[240px] group hover:shadow-lg hover:shadow-green-500/5 transition-all relative overflow-hidden">

            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 text-center"
                >
                    <h3 className="text-2xl md:text-4xl font-bold text-green-700 dark:text-green-400 text-center leading-tight">
                        {content[index].title}
                    </h3>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function AnimatedCompetitiveCard() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        // Offset start time (3s) to cascade
        const timeout = setTimeout(() => {
            const timer = setInterval(() => {
                setIndex((prev) => (prev + 1) % 3);
            }, 5000);
            return () => clearInterval(timer);
        }, 3000);
        return () => clearTimeout(timeout);
    }, []);

    const content = [
        {
            title: (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500">
                    A Competitive Streak
                </span>
            )
        },
        {
            title: (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500">
                    Gamified Finance
                </span>
            )
        },
        {
            title: (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500">
                    Weekly Challenges
                </span>
            )
        }
    ];

    return (
        <div className="md:col-span-7 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-border/60 dark:border-white/10 p-10 rounded-3xl flex items-center justify-center min-h-[240px] group transition-all hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10 overflow-hidden relative">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 text-center"
                >
                    <h3 className="text-3xl md:text-5xl font-black text-center leading-tight">
                        {content[index].title}
                    </h3>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function AnimatedSaveCard() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        // Offset start time (4s) to cascade
        const timeout = setTimeout(() => {
            const timer = setInterval(() => {
                setIndex((prev) => (prev + 1) % 3);
            }, 5000);
            return () => clearInterval(timer);
        }, 4000);
        return () => clearTimeout(timeout);
    }, []);

    const content = [
        {
            title: (
                <>
                    Save, <span className="text-muted-foreground line-through decoration-4 decoration-red-500/40 opacity-70">Not Stress</span>
                </>
            )
        },
        {
            title: (
                <>
                    Automate <span className="text-purple-500">Your Savings</span>
                </>
            )
        },
        {
            title: (
                <>
                    Achieve <span className="text-purple-500">Financial Zen</span>
                </>
            )
        }
    ];

    return (
        <div className="col-span-1 md:col-span-12 bg-card dark:bg-white/5 border border-border/60 dark:border-white/10 p-12 rounded-3xl flex items-center justify-center min-h-[180px] group hover:border-purple-500/20 transition-all overflow-hidden relative">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 text-center"
                >
                    <h3 className="text-4xl md:text-6xl font-bold text-foreground text-center leading-none">
                        {content[index].title}
                    </h3>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function StickyScrollShowcase() {
    // --- Sticky Scroll Logic ---
    const sectionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"]
    });

    // Theme Logic
    const [themeIndex, setThemeIndex] = useState(0);
    const [classicSubThemeId, setClassicSubThemeId] = useState("gold"); // Default sub-theme
    const [marvelSubThemeId, setMarvelSubThemeId] = useState("marvel_ironman"); // Default Marvel sub-theme
    const [animeSubThemeId, setAnimeSubThemeId] = useState("anime_naruto"); // Default Anime sub-theme

    // Preload Images
    useEffect(() => {
        // Preload Marvel/Anime images
        const images = ["/card-themes/iron-man.png", "/card-themes/naruto.png"];
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }, []);

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (latest < 0.25) setThemeIndex(0);
        else if (latest < 0.5) setThemeIndex(1);
        else if (latest < 0.75) setThemeIndex(2);
        else setThemeIndex(3);
    });

    // Classic Sub-Themes Data (Mirrored from constants/cardThemes.ts)
    const classicSubThemes = [
        {
            id: "gold",
            name: "Gold Prestige",
            gradient: "linear-gradient(to bottom right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)",
            textColor: "text-yellow-950",
            chipColor: "from-slate-300 to-slate-400",
            shadow: "0 25px 50px -12px rgba(234, 179, 8, 0.4)",
            headingGradient: "from-yellow-300 to-yellow-600"
        },
        {
            id: "platinum",
            name: "Platinum Elite",
            gradient: "linear-gradient(to bottom right, #E6E6E6, #ffffff, #B3B3B3)",
            textColor: "text-slate-800",
            chipColor: "from-yellow-200 to-yellow-500",
            shadow: "0 25px 50px -12px rgba(226, 232, 240, 0.4)",
            headingGradient: "from-slate-300 to-slate-500"
        },
        {
            id: "rose_gold",
            name: "Rose Gold",
            gradient: "linear-gradient(to bottom right, #B86E6E, #F2C6C6, #E6A5A5)",
            textColor: "text-rose-950",
            chipColor: "from-yellow-200 to-yellow-500",
            shadow: "0 25px 50px -12px rgba(244, 63, 94, 0.4)",
            headingGradient: "from-rose-300 to-rose-500"
        },
        {
            id: "cyberpunk",
            name: "Cyberpunk",
            gradient: "linear-gradient(to bottom right, #2b213a, #111827, #4c1d95)",
            textColor: "text-cyan-400",
            chipColor: "from-cyan-400 to-purple-500",
            shadow: "0 25px 50px -12px rgba(139, 92, 246, 0.4)",
            headingGradient: "from-purple-400 to-cyan-400"
        },
        {
            id: "forest",
            name: "Deep Forest",
            gradient: "linear-gradient(to bottom right, #134e5e, #71b280)",
            textColor: "text-white",
            chipColor: "from-yellow-200 to-yellow-500",
            shadow: "0 25px 50px -12px rgba(34, 197, 94, 0.4)",
            headingGradient: "from-green-400 to-emerald-600"
        },
        {
            id: "midnight",
            name: "Midnight Black",
            gradient: "linear-gradient(to bottom right, #000000, #434343)",
            textColor: "text-white",
            chipColor: "from-slate-200 to-slate-400",
            shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            headingGradient: "from-white to-slate-500"
        },
    ];

    const activeSubTheme = classicSubThemes.find(t => t.id === classicSubThemeId) || classicSubThemes[0];

    // Marvel Sub-Themes Data
    const marvelSubThemes = [
        {
            id: "marvel_ironman",
            name: "Iron Man",
            gradient: "linear-gradient(to bottom right, #7B0000, #D4AF37)",
            image: "/card-themes/iron-man.png",
            textColor: "text-white",
            chipColor: "from-cyan-200 to-cyan-400",
            shadow: "0 25px 50px -12px rgba(220, 38, 38, 0.5)",
            headingGradient: "from-red-500 to-amber-500"
        },
        {
            id: "marvel_cap",
            name: "Captain America",
            gradient: "linear-gradient(to bottom right, #002244, #8B0000, #FFFFF0)",
            image: "/card-themes/captain-america.png",
            textColor: "text-white",
            chipColor: "from-blue-400 to-red-500",
            shadow: "0 25px 50px -12px rgba(59, 130, 246, 0.5)",
            headingGradient: "from-blue-600 to-red-600"
        },
        {
            id: "marvel_hulk",
            name: "The Hulk",
            gradient: "linear-gradient(to bottom right, #4B6F44, #32CD32)",
            image: "/card-themes/hulk.png",
            textColor: "text-white",
            chipColor: "from-green-400 to-purple-500",
            shadow: "0 25px 50px -12px rgba(34, 197, 94, 0.5)",
            headingGradient: "from-green-500 to-green-700"
        },
        {
            id: "marvel_widow",
            name: "Black Widow",
            gradient: "linear-gradient(to bottom right, #000000, #8B0000)",
            image: "/card-themes/black-widow.png",
            textColor: "text-white",
            chipColor: "from-red-500 to-gray-800",
            shadow: "0 25px 50px -12px rgba(185, 28, 28, 0.5)",
            headingGradient: "from-red-500 to-white"
        },
        {
            id: "marvel_thor",
            name: "Thor",
            gradient: "linear-gradient(to bottom right, #1F2937, #9CA3AF, #FCD34D)",
            image: "/card-themes/thor.jpg",
            textColor: "text-white",
            chipColor: "from-blue-300 to-yellow-300",
            shadow: "0 25px 50px -12px rgba(234, 179, 8, 0.5)",
            headingGradient: "from-yellow-300 to-white"
        },
        {
            id: "marvel_loki",
            name: "Loki",
            gradient: "linear-gradient(to bottom right, #006400, #FFD700)",
            image: "/card-themes/loki.jpg",
            textColor: "text-yellow-100",
            chipColor: "from-green-400 to-yellow-500",
            shadow: "0 25px 50px -12px rgba(34, 197, 94, 0.5)",
            headingGradient: "from-green-400 to-yellow-200"
        },
        {
            id: "marvel_spiderman",
            name: "Spider-Man",
            gradient: "linear-gradient(to bottom right, #C8102E, #2F80ED)",
            image: "/card-themes/spiderman.png",
            textColor: "text-white",
            chipColor: "from-red-500 to-blue-500",
            shadow: "0 25px 50px -12px rgba(220, 38, 38, 0.5)",
            headingGradient: "from-red-600 to-blue-600"
        },
        {
            id: "marvel_strange",
            name: "Doctor Strange",
            gradient: "linear-gradient(to bottom right, #4B0082, #FF4500)",
            image: "/card-themes/doctor-strange.jpg",
            textColor: "text-white",
            chipColor: "from-purple-500 to-orange-500",
            shadow: "0 25px 50px -12px rgba(147, 51, 234, 0.5)",
            headingGradient: "from-purple-600 to-orange-500"
        }
    ];

    const activeMarvelTheme = marvelSubThemes.find(t => t.id === marvelSubThemeId) || marvelSubThemes[0];

    // Anime Sub-Themes Data
    const animeSubThemes = [
        {
            id: "anime_naruto",
            name: "Naruto",
            gradient: "linear-gradient(to bottom right, #FFA500, #000000)",
            image: "/card-themes/naruto.png",
            textColor: "text-white",
            chipColor: "from-orange-400 to-yellow-500",
            shadow: "0 25px 50px -12px rgba(249, 115, 22, 0.5)",
            headingGradient: "from-orange-400 to-yellow-300"
        },
        {
            id: "anime_luffy",
            name: "Luffy",
            gradient: "linear-gradient(to bottom right, #FF0000, #FFD700)",
            image: "/card-themes/one-piece.jpg",
            textColor: "text-white",
            chipColor: "from-yellow-400 to-red-500",
            shadow: "0 25px 50px -12px rgba(220, 38, 38, 0.5)",
            headingGradient: "from-yellow-300 to-red-500"
        },
        {
            id: "anime_aot",
            name: "Attack on Titan",
            gradient: "linear-gradient(to bottom right, #556B2F, #8B4513)",
            image: "/card-themes/aot.jpg",
            textColor: "text-white",
            chipColor: "from-green-700 to-yellow-700",
            shadow: "0 25px 50px -12px rgba(85, 107, 47, 0.5)",
            headingGradient: "from-green-400 to-yellow-600"
        },
        {
            id: "anime_demonslayer",
            name: "Demon Slayer",
            gradient: "linear-gradient(to bottom right, #000000, #3CB371)",
            image: "/card-themes/demon-slayer.png",
            textColor: "text-white",
            chipColor: "from-green-400 to-black",
            shadow: "0 25px 50px -12px rgba(22, 163, 74, 0.5)",
            headingGradient: "from-green-400 to-emerald-200"
        },
        {
            id: "anime_sololeveling",
            name: "Solo Leveling",
            gradient: "linear-gradient(to bottom right, #000000, #4B0082)",
            image: "/card-themes/solo-leveling.png",
            textColor: "text-blue-100",
            chipColor: "from-purple-500 to-blue-500",
            shadow: "0 25px 50px -12px rgba(79, 70, 229, 0.5)",
            headingGradient: "from-purple-400 to-indigo-300"
        },
        {
            id: "anime_deathnote",
            name: "Death Note",
            gradient: "linear-gradient(to bottom right, #000000, #8B0000)",
            image: "/card-themes/death-note.png",
            textColor: "text-white",
            chipColor: "from-red-600 to-black",
            shadow: "0 25px 50px -12px rgba(220, 38, 38, 0.5)",
            headingGradient: "from-white to-red-600"
        },
        {
            id: "anime_spyxfamily",
            name: "Spy x Family",
            gradient: "linear-gradient(to bottom right, #2E8B57, #FFC0CB)",
            image: "/card-themes/spy-x-family.png",
            textColor: "text-white",
            chipColor: "from-green-400 to-pink-400",
            shadow: "0 25px 50px -12px rgba(236, 72, 153, 0.5)",
            headingGradient: "from-pink-300 to-green-300"
        },
        {
            id: "anime_dandadan",
            name: "Dandadan",
            gradient: "linear-gradient(to bottom right, #800080, #FF00FF)",
            image: "/card-themes/dandadan.jpg",
            textColor: "text-white",
            chipColor: "from-purple-500 to-pink-500",
            shadow: "0 25px 50px -12px rgba(219, 39, 119, 0.5)",
            headingGradient: "from-pink-400 to-purple-400"
        }
    ];

    const activeAnimeTheme = animeSubThemes.find(t => t.id === animeSubThemeId) || animeSubThemes[0];

    // Dynamic styles based on themeIndex
    const themes = [
        {
            id: 'blue',
            label: "BudGlio Original",
            desc: "Begin with the default card — a balanced, distraction-free design crafted for everyday use. Switch to themed cards anytime to match your mood or personality.",
            gradient: "linear-gradient(to bottom right, #172554, #1e3a8a, #0f172a)", // Deep Royal Blue
            image: null,
            textColor: "text-white",
            chipColor: "from-blue-400 to-indigo-500",
            shadow: "0 25px 50px -12px rgba(30, 58, 138, 0.4)",
            headingGradient: "from-blue-400 to-indigo-500"
        },
        {
            id: 'gold', // This ID triggers the selector UI
            label: "Classic Themes",
            desc: "Unlock premium aesthetics for your wallet. Choose from Gold, Platinum, Rose Gold, and more.",
            gradient: activeSubTheme.gradient,
            image: null,
            textColor: activeSubTheme.textColor,
            chipColor: activeSubTheme.chipColor,
            shadow: activeSubTheme.shadow,
            headingGradient: activeSubTheme.headingGradient
        },
        {
            id: 'marvel',
            label: "Marvel Universe",
            desc: "Unleash your inner hero with our exclusive Marvel partnership designs. Collect them all.",
            gradient: activeMarvelTheme.gradient,
            image: activeMarvelTheme.image,
            textColor: activeMarvelTheme.textColor,
            chipColor: activeMarvelTheme.chipColor,
            shadow: activeMarvelTheme.shadow,
            headingGradient: activeMarvelTheme.headingGradient
        },
        {
            id: 'anime',
            label: "Anime Collection",
            desc: "Showcase your fandom with limited edition Anime collection cards. Collect them all.",
            gradient: activeAnimeTheme.gradient,
            image: activeAnimeTheme.image,
            textColor: activeAnimeTheme.textColor,
            chipColor: activeAnimeTheme.chipColor,
            shadow: activeAnimeTheme.shadow,
            headingGradient: activeAnimeTheme.headingGradient
        }
    ];

    const currentTheme = themes[themeIndex];

    return (
        <section ref={sectionRef} className="relative h-[400vh] bg-background dark:bg-slate-950 z-20 mt-[-1px] transition-colors duration-300">
            {/* Sticky Wrapper */}
            <div className="sticky top-0 h-screen w-full overflow-hidden">

                {/* Dynamic Background */}
                <div className="absolute inset-0 z-0 transition-colors duration-1000 ease-in-out bg-background dark:bg-slate-950">
                    <div
                        className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-[32%] lg:top-1/2 lg:translate-y-[-50%] w-[800px] h-[800px] rounded-full blur-[120px] transition-all duration-1000 opacity-20"
                        style={{
                            background: themeIndex === 0 ? '#1e3a8a' : themeIndex === 1 ? '#eab308' : themeIndex === 2 ? '#ef4444' : '#f97316'
                        }}
                    />
                </div>

                {/* Heading */}
                <div className="absolute top-24 left-0 right-0 z-30 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-400 mb-2"
                    >
                        Pick Your Power Card
                    </motion.h2>
                    <p className="text-muted-foreground dark:text-slate-400 text-lg">Choose a style that matches your ambition.</p>
                </div>

                {/* Content Container */}
                <div className="absolute inset-0 z-10 transition-all duration-300">

                    {/* The Center Card - Absolutely Positioned */}
                    <div
                        className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-[32%] lg:top-1/2 lg:translate-y-[-50%] w-[90vw] max-w-[380px] md:max-w-none md:w-[500px] aspect-[1.586/1] rounded-3xl border border-border/10 dark:border-white/10 flex flex-col justify-between group bg-slate-900 shadow-2xl overflow-hidden"
                        style={{
                            background: currentTheme.image ? `url(${currentTheme.image}) center/cover no-repeat` : currentTheme.gradient,
                            boxShadow: currentTheme.shadow
                        }}
                    >
                        {/* Dark Overlay for Image Themes */}
                        {currentTheme.image && <div className="absolute inset-0 bg-black/20 rounded-3xl" />}

                        {/* Shine Effect Overlay */}
                        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden rounded-3xl">
                            <div className="absolute top-0 left-0 w-[200%] h-full bg-[linear-gradient(115deg,transparent_0%,transparent_40%,rgba(255,255,255,0.4)_45%,rgba(255,255,255,0.2)_50%,transparent_55%,transparent_100%)] animate-[shine-flow_5s_infinite_ease-in-out]" />
                        </div>

                        {/* Card Content Overlay */}
                        <div className="relative z-10 w-full h-full p-8 flex flex-col justify-between">

                            {/* Top Row */}
                            <div className="flex justify-between items-start">
                                {/* Left: Label and Chip */}
                                <div className="space-y-5">
                                    <div className={`text-lg font-bold tracking-wide opacity-90 ${currentTheme.textColor}`}>BudGlio Card</div>
                                    <div className={`w-12 h-9 bg-gradient-to-br ${currentTheme.chipColor} rounded-md border border-white/20 relative overflow-hidden shadow-sm`}>
                                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/20" />
                                        <div className="absolute top-0 left-1/2 h-full w-[1px] bg-black/20" />
                                        <div className="absolute top-1/2 left-1/2 w-5 h-5 border border-black/20 rounded-sm -translate-x-1/2 -translate-y-1/2" />
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none mix-blend-overlay" />
                                    </div>
                                </div>

                                {/* Right: BudGlio Logo Symbol */}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`w-10 h-10 opacity-90 ${currentTheme.textColor}`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 8.5C5 8.5 9 4.5 12 4.5C15 4.5 19 8.5 19 8.5" />
                                    <path d="M8 18.5C8 18.5 9.5 15.5 9.5 13.5C9.5 12 10.5 11 12 11C13.5 11 14.5 12 14.5 13.5C14.5 15.5 16 18.5 16 18.5" />
                                </svg>
                            </div>

                            {/* Middle/Bottom Section */}
                            <div className="space-y-8">
                                {/* Card Number */}
                                <div className={`text-2xl font-mono tracking-widest opacity-90 text-shadow-glow ${currentTheme.textColor}`}>
                                    **** **** **** 3728
                                </div>

                                {/* Details Row */}
                                <div className={`flex justify-between items-end ${currentTheme.textColor}`}>
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider mb-1 opacity-70">Card Holder</div>
                                        <div className="text-lg font-medium tracking-wide">JOHN DOE</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase tracking-wider mb-1 opacity-70">Issued</div>
                                        <div className="text-lg font-medium tracking-wide">12/30</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative w-full h-1.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                                    <div className={`absolute top-0 left-0 h-full w-[65%] bg-gradient-to-r ${currentTheme.chipColor}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Text - Absolutely Positioned at Bottom */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={themeIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-[65%] left-0 right-0 px-4 flex flex-col justify-center items-center lg:top-0 lg:bottom-0 lg:left-[58%] lg:right-auto lg:w-auto lg:-translate-x-1/2 lg:pl-0 lg:py-0"
                        >
                            <div className="flex flex-col items-center text-center lg:items-center lg:text-center max-w-md mx-auto lg:mx-0 w-full">
                                <h3 className={`text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${currentTheme.headingGradient} mb-4 drop-shadow-sm py-2 leading-relaxed`}>
                                    {currentTheme.label}
                                </h3>
                                <p className="text-muted-foreground dark:text-slate-400 text-lg leading-relaxed mb-6">
                                    {currentTheme.desc}
                                </p>

                                {/* Sub-Theme Selector for Classic Themes */}
                                {currentTheme.id === 'gold' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-wrap justify-center gap-3 w-full"
                                    >
                                        {classicSubThemes.map((subTheme) => (
                                            <button
                                                key={subTheme.id}
                                                onClick={() => setClassicSubThemeId(subTheme.id)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${classicSubThemeId === subTheme.id
                                                    ? "bg-muted dark:bg-white/10 border-border/40 dark:border-white/40 text-foreground dark:text-white shadow-lg scale-105"
                                                    : "bg-transparent border-border/10 dark:border-white/10 text-muted-foreground dark:text-slate-400 hover:bg-muted/50 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-slate-200"
                                                    }`}
                                            >
                                                {subTheme.name}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Sub-Theme Selector for Marvel Themes */}
                                {currentTheme.id === 'marvel' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-wrap justify-center gap-2 w-full"
                                    >
                                        {marvelSubThemes.map((subTheme) => (
                                            <button
                                                key={subTheme.id}
                                                onClick={() => setMarvelSubThemeId(subTheme.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 border ${marvelSubThemeId === subTheme.id
                                                    ? "bg-red-500/10 dark:bg-red-500/20 border-red-500/40 dark:border-red-500/50 text-foreground dark:text-white shadow-lg scale-105"
                                                    : "bg-transparent border-border/10 dark:border-white/10 text-muted-foreground dark:text-slate-400 hover:bg-red-500/5 dark:hover:bg-red-500/10 hover:text-foreground dark:hover:text-slate-200"
                                                    }`}
                                            >
                                                {subTheme.name}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Sub-Theme Selector for Anime Themes */}
                                {currentTheme.id === 'anime' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-wrap justify-center gap-2 w-full"
                                    >
                                        {animeSubThemes.map((subTheme) => (
                                            <button
                                                key={subTheme.id}
                                                onClick={() => setAnimeSubThemeId(subTheme.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 border ${animeSubThemeId === subTheme.id
                                                    ? "bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/40 dark:border-indigo-500/50 text-foreground dark:text-white shadow-lg scale-105"
                                                    : "bg-transparent border-border/10 dark:border-white/10 text-muted-foreground dark:text-slate-400 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 hover:text-foreground dark:hover:text-slate-200"
                                                    }`}
                                            >
                                                {subTheme.name}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

        </section>
    );
};



function CheckItem({ text, highlight = false }: { text: string, highlight?: boolean }) {
    return (
        <li className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${highlight ? 'bg-green-500 text-white' : 'bg-muted dark:bg-slate-800 text-green-500'}`}>
                <Check className="w-3 h-3" />
            </div>
            <span className={highlight ? 'text-foreground font-medium' : 'text-muted-foreground'}>{text}</span>
        </li>
    );
}

export default LandingPage;
