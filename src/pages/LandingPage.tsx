import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, Zap, TrendingUp, Users, Smartphone, CreditCard, Menu, X, Star } from "lucide-react";
import { PaymentRegistrationDialog } from "@/components/payment/PaymentRegistrationDialog";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { useNavigate } from "react-router-dom";
import { BenefitsGrid } from "@/components/landing/BenefitsGrid";
import { AnimatePresence, motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

const LandingPage = () => {
    const navigate = useNavigate();
    const { loading } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium' | null>(null);
    const [minLoading, setMinLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hidden, setHidden] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() || 0;
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
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
        <div className="min-h-screen bg-slate-950 text-white selection:bg-green-500/30 font-sans">
            {/* Navbar */}
            <header className={`fixed top-0 w-full z-50 transition-transform duration-300 bg-slate-950/80 backdrop-blur-md border-b border-white/10 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tight cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img
                            src="/logo.jpg"
                            alt="BudGlio Logo"
                            className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-green-500/20"
                        />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">BudGlio</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        {['Benefits', 'Features', 'Eligibility', 'Pricing'].map((item) => (
                            <button
                                key={item}
                                onClick={() => scrollToSection(item.toLowerCase())}
                                className="text-sm font-medium text-slate-300 hover:text-green-400 transition-colors"
                            >
                                {item}
                            </button>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10" onClick={() => navigate("/auth")}>Login</Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all" onClick={() => scrollToSection('pricing')}>
                            Start Saving
                        </Button>
                    </div>

                    <button className="md:hidden p-2 text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 top-20 z-40 bg-slate-950/95 backdrop-blur-xl md:hidden flex flex-col p-6 space-y-6"
                    >
                        {['Benefits', 'Features', 'Eligibility', 'Pricing'].map((item) => (
                            <button
                                key={item}
                                onClick={() => scrollToSection(item.toLowerCase())}
                                className="text-xl font-medium text-slate-300 text-left border-b border-white/5 pb-4"
                            >
                                {item}
                            </button>
                        ))}
                        <div className="pt-4 space-y-4">
                            <Button variant="outline" className="w-full justify-center border-white/10 text-slate-300 hover:bg-white/5" onClick={() => navigate("/auth")}>Login</Button>
                            <Button className="w-full justify-center bg-green-600 hover:bg-green-700" onClick={() => { scrollToSection('pricing'); setMobileMenuOpen(false); }}>
                                Start Saving
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* INTEGRATED SCROLL HERO */}
            {/* Render Hero Section only after loading is complete to ensure refs are hydrated */}
            <HeroIntro scrollToSection={scrollToSection} />
            <FeaturesSection />
            <StickyScrollShowcase />

            {/* Benefits Bento Grid Section */}
            <BenefitsGrid />

            {/* Partners/Rewards Section */}
            <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4 text-white">The Rewards keep coming</h2>
                    <p className="text-slate-400 mb-12">We have partnered with top brands to bring you exclusive deals.</p>

                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {['AMAZON', 'UBER', 'ZOMATO', 'SWIGGY'].map((partner) => (
                            <div key={partner} className="flex items-center gap-2 text-2xl font-bold text-white bg-white/5 px-6 py-3 rounded-full border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-white/10" />
                                {partner}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Key Features */}
            <section id="features" className="py-24 bg-slate-950">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-16">Key Features</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Shield className="w-12 h-12 text-green-500" />}
                            title="Security"
                            description="Encrypted data and 2-factor authentication for total peace of mind."
                        />
                        <FeatureCard
                            icon={<Smartphone className="w-12 h-12 text-green-500" />}
                            title="Mobile App"
                            description="Monitor spends, get timely reminders and track on the go."
                        />
                        <FeatureCard
                            icon={<CreditCard className="w-12 h-12 text-green-500" />}
                            title="Convenience"
                            description="Intuitive interface designed for modern financial tracking."
                        />
                    </div>
                </div>
            </section>

            {/* Usage Stats / Eligibility */}
            <section id="eligibility" className="py-20 bg-slate-900/50">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-16">
                    <div className="space-y-8 max-w-md">
                        <h2 className="text-4xl font-bold">Eligibility</h2>
                        <ul className="space-y-6">
                            {[
                                'Active Email Address',
                                'Commitment to Saving',
                                'Ready to Level Up',
                                'Any Age Group'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-lg text-slate-300">
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-green-500/20 blur-[80px]" />
                        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                            <div className="flex gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg">
                                    Bg
                                </div>
                                <div>
                                    <div className="font-bold text-lg">One Time Fee</div>
                                    <div className="text-slate-400 text-sm">Lifetime Access</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-2 bg-slate-700 rounded-full w-48" />
                                <div className="h-2 bg-slate-700 rounded-full w-32" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 px-4 bg-slate-950 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-[120px]" />

                <div className="container mx-auto relative z-10">
                    <h2 className="text-4xl font-bold text-center mb-4">Choose Your Path</h2>
                    <p className="text-center text-slate-400 mb-16 text-lg">Simple pricing. No hidden fees.</p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Standard Plan */}
                        <Card
                            className={`relative border-2 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 cursor-pointer ${selectedPlan === 'standard' ? 'border-green-500 shadow-xl shadow-green-500/10' : 'border-white/10 hover:border-green-500/50'}`}
                            onClick={() => setSelectedPlan('standard')}
                        >
                            <CardHeader>
                                <CardTitle className="text-3xl text-white">Standard Agent</CardTitle>
                                <CardDescription className="text-slate-400">Everything you need to start tracking.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="text-5xl font-bold text-white">₹99</div>
                                <ul className="space-y-3">
                                    <CheckItem text="Unlimited Transactions" />
                                    <CheckItem text="Basic Budgeting" />
                                    <CheckItem text="Family Features" />
                                    <CheckItem text="Standard Themes" />
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-white/10 hover:bg-white/20 text-white" variant="outline">Select Standard</Button>
                            </CardFooter>
                        </Card>

                        {/* Premium Plan */}
                        <Card
                            className={`relative border-2 bg-gradient-to-b from-slate-900 to-slate-950 transition-all duration-300 transform hover:scale-105 cursor-pointer ${selectedPlan === 'premium' ? 'border-green-500 shadow-2xl shadow-green-500/20' : 'border-green-500/30'}`}
                            onClick={() => setSelectedPlan('premium')}
                        >
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg">
                                <Star className="w-3 h-3 fill-current" /> Most Popular
                            </div>
                            <CardHeader>
                                <CardTitle className="text-3xl text-white">Elite Agent</CardTitle>
                                <CardDescription className="text-slate-400">Unlock the full potential of your ledger.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">₹249</div>
                                <ul className="space-y-3">
                                    <CheckItem text="Everything in Standard" />
                                    <CheckItem text="Premium Themes Pack" highlight />
                                    <CheckItem text="Exclusive Card Skins" highlight />
                                    <CheckItem text="Priority Support" />
                                    <CheckItem text="Founder Badge" highlight />
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25">Select Elite</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-950 border-t border-white/10">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 font-bold text-2xl mb-6 opacity-80">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-white">BudGlio</span>
                    </div>
                    <div className="flex justify-center gap-8 mb-8 text-sm text-slate-400">
                        <a href="#" className="hover:text-green-400 transition-colors">Terms</a>
                        <a href="#" className="hover:text-green-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-green-400 transition-colors">Contact</a>
                    </div>
                    <p className="text-slate-600 text-sm">
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
                title={selectedPlan === 'premium' ? 'Elite Agent' : 'Standard Agent'}
            />
        </div>
    );
};

const HeroIntro = ({ scrollToSection }: { scrollToSection: (id: string) => void }) => {
    return (
        <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 bg-slate-950 z-10">
            {/* Background Ambience for Intro */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[100px] animate-pulse" />
            </div>

            <div className="z-10 mt-[-10vh]"> {/* Slight offset up */}
                <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-8 leading-tight">
                    Signup for <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">BudGlio</span> <br />
                    & Get <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">Smart</span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                    Gamify your finances, track every penny, and join a community of smart savers.
                </p>
                <Button
                    className="h-16 px-12 text-xl rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-xl shadow-green-500/20 hover:shadow-green-500/40 transition-all transform hover:scale-105"
                    onClick={() => scrollToSection('pricing')}
                >
                    Start Saving
                </Button>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-10 z-10 text-slate-500 flex flex-col items-center gap-2"
            >
                <span className="text-sm uppercase tracking-widest">Scroll to Explore</span>
                <div className="w-1 h-12 bg-gradient-to-b from-green-500/50 to-transparent rounded-full" />
            </motion.div>
        </section>
    );
};

const StickyScrollShowcase = () => {
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
        <section ref={sectionRef} className="relative h-[400vh] bg-slate-950 z-20 mt-[-1px]">
            {/* Sticky Wrapper */}
            <div className="sticky top-0 h-screen w-full overflow-hidden">

                {/* Dynamic Background */}
                <div className="absolute inset-0 z-0 transition-colors duration-1000 ease-in-out bg-slate-950">
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
                        className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-500 mb-2"
                    >
                        Pick Your Power Card
                    </motion.h2>
                    <p className="text-slate-400 text-lg">Choose a style that matches your ambition.</p>
                </div>

                {/* Content Container */}
                <div className="absolute inset-0 z-10 transition-all duration-300">

                    {/* The Center Card - Absolutely Positioned */}
                    <div
                        className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-[32%] lg:top-1/2 lg:translate-y-[-50%] w-[90vw] max-w-[380px] md:max-w-none md:w-[500px] aspect-[1.586/1] rounded-3xl border border-white/10 flex flex-col justify-between group bg-slate-900 shadow-2xl overflow-hidden"
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
                                <h3 className={`text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${currentTheme.headingGradient} mb-4 drop-shadow-sm`}>
                                    {currentTheme.label}
                                </h3>
                                <p className="text-slate-400 text-lg leading-relaxed mb-6">
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
                                                    ? "bg-white/10 border-white/40 text-white shadow-lg scale-105"
                                                    : "bg-transparent border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
                                                    ? "bg-red-500/20 border-red-500/50 text-white shadow-lg scale-105"
                                                    : "bg-transparent border-white/10 text-slate-400 hover:bg-red-500/10 hover:text-slate-200"
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
                                                    ? "bg-indigo-500/20 border-indigo-500/50 text-white shadow-lg scale-105"
                                                    : "bg-transparent border-white/10 text-slate-400 hover:bg-indigo-500/10 hover:text-slate-200"
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

const BenefitItem = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex flex-col items-center text-center space-y-4 group">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
);

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 hover:border-green-500/30 transition-all duration-300 text-center flex flex-col items-center gap-6 group hover:-translate-y-1">
        <div className="transform group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-slate-400">{description}</p>
    </div>
);

const CheckItem = ({ text, highlight = false }: { text: string, highlight?: boolean }) => (
    <li className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${highlight ? 'bg-green-500 text-white' : 'bg-slate-800 text-green-500'}`}>
            <Check className="w-3 h-3" />
        </div>
        <span className={highlight ? 'text-white font-medium' : 'text-slate-300'}>{text}</span>
    </li>
);

export default LandingPage;
