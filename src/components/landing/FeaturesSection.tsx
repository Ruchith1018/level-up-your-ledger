import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Trophy, Users, ChevronRight, Check, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeroDashboardPreview } from './HeroDashboardPreview';
import { AnalyticsPreview } from './AnalyticsPreview';
import { FamilyFeaturePreview } from './FamilyFeaturePreview';
import { ProfileFeaturePreview } from './ProfileFeaturePreview';

interface Feature {
    id: string;
    title: string;
    shortDesc: string;
    fullDesc: string;
    icon: React.ElementType;
    image: string;
    imageGradient: string;
    details: string[];
    theme: {
        text: string;
        bg: string;
        border: string;
        icon: string;
    };
}

const features: Feature[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        shortDesc: 'Complete financial overview.',
        fullDesc: 'Get a bird\'s eye view of your data. Real-time updates on income, expenses, and savings goals in one unified interface.',
        icon: LayoutDashboard,
        image: '/assets/feature-dashboard.png',
        imageGradient: 'from-blue-600/20 to-indigo-600/20',
        details: [
            'Real-time balance tracking',
            'Recent transaction history',
            'Quick action shortcuts',
            'Customizable widgets'
        ],
        theme: {
            text: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500',
            border: 'border-blue-500/20',
            icon: 'text-blue-600 dark:text-blue-400'
        }
    },
    {
        id: 'analytics',
        title: 'Analytics',
        shortDesc: 'Deep insights & trends.',
        fullDesc: 'Understand your spending habits with powerful visualization tools. Track categories, monthly trends, and identify areas to save.',
        icon: TrendingUp,
        image: '/assets/feature-analytics.png',
        imageGradient: 'from-emerald-500/20 to-green-600/20',
        details: [
            'Category-wise breakdown',
            'Monthly spending trends',
            'Savings rate analysis',
            'Exportable reports'
        ],
        theme: {
            text: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500',
            border: 'border-emerald-500/20',
            icon: 'text-emerald-600 dark:text-emerald-400'
        }
    },
    {
        id: 'gamification',
        title: 'Gamification',
        shortDesc: 'Level up your savings.',
        fullDesc: 'Make personal finance fun. Earn XP for saving streaks, unlock badges, and compete on the leaderboard with friends.',
        icon: Trophy,
        image: '/assets/feature-gamification.png',
        imageGradient: 'from-orange-500/20 to-amber-500/20',
        details: [
            'Daily & weekly challenges',
            'Achievement badges',
            'Global leaderboards',
            'Streak rewards'
        ],
        theme: {
            text: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-500',
            border: 'border-orange-500/20',
            icon: 'text-orange-600 dark:text-orange-400'
        }
    },
    {
        id: 'family',
        title: 'Family',
        shortDesc: 'Manage household money.',
        fullDesc: 'Collaborate with your partner or family. Shared budgets, synchronized goals, and transparent tracking for the whole household.',
        icon: Users,
        image: '/assets/feature-family.png',
        imageGradient: 'from-pink-500/20 to-rose-500/20',
        details: [
            'Shared wallets',
            'Family budget limits',
            'Activity notifications',
            'Role-based access'
        ],
        theme: {
            text: 'text-pink-600 dark:text-pink-400',
            bg: 'bg-pink-500',
            border: 'border-pink-500/20',
            icon: 'text-pink-600 dark:text-pink-400'
        }
    },
    {
        id: 'profile',
        title: 'Profile',
        shortDesc: 'Your financial identity.',
        fullDesc: 'Customize your experience. Manage settings, view your badge collection, and track your overall level and progress.',
        icon: User,
        image: '/assets/feature-profile.png',
        imageGradient: 'from-purple-500/20 to-violet-500/20',
        details: [
            'Custom Avatars',
            'Theme Preferences',
            'Badge Showcase',
            'Account Settings'
        ],
        theme: {
            text: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-500',
            border: 'border-purple-500/20',
            icon: 'text-purple-600 dark:text-purple-400'
        }
    }
];

export const FeaturesSection = () => {
    const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

    return (
        <section className="py-24 bg-background dark:bg-slate-950 text-foreground dark:text-white relative overflow-hidden transition-colors duration-300">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">

                {/* Header */}
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-foreground dark:text-white">
                        Power-packed features for <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500 dark:from-green-400 dark:to-emerald-400">smarter financial decisions</span>
                    </h2>
                    <p className="text-muted-foreground dark:text-slate-400 text-lg max-w-2xl mx-auto">
                        Everything you need to take control of your money, gamify your savings, and build wealth together.
                    </p>
                </div>



                {/* Main Interactive Display area */}
                <div className="bg-card dark:bg-slate-900 border border-border/10 dark:border-white/5 rounded-3xl p-4 md:p-8 grid lg:grid-cols-12 gap-8 shadow-2xl relative overflow-hidden transition-colors duration-300">
                    {/* Background blob for the container */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

                    {/* Left Side: Accordion/Selection List */}
                    <div className="lg:col-span-4 flex flex-col justify-center space-y-2">
                        {features.map((feature, index) => {
                            const isActive = activeFeatureIndex === index;

                            return (
                                <motion.div
                                    key={feature.id}
                                    onClick={() => setActiveFeatureIndex(index)}
                                    className={cn(
                                        "relative p-6 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group border",
                                        isActive
                                            ? `bg-muted dark:bg-white/5 border-border/20 dark:border-white/10 shadow-lg`
                                            : "border-transparent hover:bg-muted/50 dark:hover:bg-white/5"
                                    )}
                                >
                                    {/* Active Highlight Border/Glow */}
                                    {isActive && (
                                        <div className={cn("absolute inset-0 bg-gradient-to-r opacity-5 pointer-events-none", feature.imageGradient)} />
                                    )}

                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="space-y-4 w-full">
                                            <h3 className={cn(
                                                "text-xl font-bold flex items-center gap-3 transition-colors",
                                                isActive ? feature.theme.text : "text-foreground dark:text-white group-hover:text-muted-foreground dark:group-hover:text-slate-200"
                                            )}>
                                                {feature.title}
                                                {isActive && (
                                                    <motion.span
                                                        layoutId="active-dot"
                                                        className={cn("w-2 h-2 rounded-full", feature.theme.bg)}
                                                    />
                                                )}
                                            </h3>

                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="text-muted-foreground dark:text-slate-400 text-sm leading-relaxed"
                                                    >
                                                        {feature.fullDesc}
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.1 }}
                                                            className="mt-4 pt-4 border-t border-border/10 dark:border-white/10 flex flex-col gap-3"
                                                        >
                                                            {feature.details.map((detail, i) => (
                                                                <div key={i} className="flex items-center gap-2.5 text-foreground/80 dark:text-slate-300">
                                                                    <div className={cn("p-0.5 rounded-full bg-muted dark:bg-white/5", feature.theme.text)}>
                                                                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                                                    </div>
                                                                    <span>{detail}</span>
                                                                </div>
                                                            ))}
                                                        </motion.div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <ChevronRight className={cn(
                                            "w-5 h-5 transition-transform duration-300 shrink-0 mt-1",
                                            isActive ? `rotate-90 ${feature.theme.text}` : "text-muted-foreground dark:text-slate-500"
                                        )} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Right Side: Dynamic Image/Preview Area */}
                    <div className="lg:col-span-8 bg-card dark:bg-slate-950 rounded-2xl border border-border/10 dark:border-white/10 relative overflow-hidden aspect-[4/3] flex items-center justify-center transition-colors duration-300">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeFeatureIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.4 }}
                                className="w-full h-full flex items-center justify-center bg-transparent"
                            >
                                {features[activeFeatureIndex].id === 'dashboard' ? (
                                    <div className="absolute inset-0 w-[133.33%] h-[133.33%] transform scale-[0.75] origin-top-left">
                                        <HeroDashboardPreview className="w-full h-full min-h-0 shadow-none border-none bg-transparent rounded-none transform scale-100" />
                                    </div>
                                ) : features[activeFeatureIndex].id === 'analytics' ? (
                                    <div className="absolute inset-0 w-[133.33%] h-[133.33%] transform scale-[0.75] origin-top-left">
                                        <AnalyticsPreview className="w-full h-full min-h-0 shadow-none border-none bg-transparent rounded-none" />
                                    </div>
                                ) : features[activeFeatureIndex].id === 'family' ? (
                                    <div className="absolute inset-0 w-[133.33%] h-[133.33%] transform scale-[0.75] origin-top-left">
                                        <FamilyFeaturePreview className="w-full h-full min-h-0 shadow-none border-none bg-transparent rounded-none" />
                                    </div>
                                ) : features[activeFeatureIndex].id === 'profile' ? (
                                    <div className="absolute inset-0 w-[133.33%] h-[133.33%] transform scale-[0.75] origin-top-left">
                                        <ProfileFeaturePreview className="w-full h-full min-h-0 shadow-none border-none bg-transparent rounded-none" />
                                    </div>
                                ) : ['gamification', 'leaderboard'].includes(features[activeFeatureIndex].id) ? (
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-500">
                                        <div className="w-24 h-24 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center mb-6 ring-1 ring-border/10 dark:ring-white/10 shadow-xl">
                                            {React.createElement(features[activeFeatureIndex].icon, { className: "w-10 h-10 text-muted-foreground dark:text-slate-400" })}
                                        </div>
                                        <h3 className="text-3xl font-bold text-foreground dark:text-white mb-3 tracking-tight">Under Development</h3>
                                        <p className="text-muted-foreground dark:text-slate-400 text-lg max-w-md leading-relaxed">
                                            We're crafting something special here. Check back soon for updates!
                                        </p>
                                    </div>
                                ) : (
                                    <img
                                        src={features[activeFeatureIndex].image}
                                        alt={features[activeFeatureIndex].title}
                                        className="w-full h-auto rounded-xl shadow-2xl border border-border/10 dark:border-white/10 object-contain hover:scale-105 transition-transform duration-500"
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};
