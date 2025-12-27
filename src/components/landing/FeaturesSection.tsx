import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Trophy, Users, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeroDashboardPreview } from './HeroDashboardPreview';
import { AnalyticsPreview } from './AnalyticsPreview';

interface Feature {
    id: string;
    title: string;
    shortDesc: string;
    fullDesc: string;
    icon: React.ElementType;
    image: string;
    imageGradient: string;
    details: string[];
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
        ]
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
        ]
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
        ]
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
        ]
    },
    {
        id: 'leaderboard',
        title: 'Leaderboard',
        shortDesc: 'Complete tasks & level up.',
        fullDesc: 'Compete daily, climb the ranks, and earn bragging rights. Complete financial tasks to gain XP and stay ahead of your friends.',
        icon: Trophy,
        image: '/assets/feature-leaderboard.png',
        imageGradient: 'from-purple-500/20 to-violet-500/20',
        details: [
            'Global & friends ranking',
            'Weekly XP levels',
            'Achievement badges',
            'Exclusive rewards'
        ]
    }
];

export const FeaturesSection = () => {
    const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

    return (
        <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">

                {/* Header */}
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        Power-packed features for <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">smarter financial decisions</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Everything you need to take control of your money, gamify your savings, and build wealth together.
                    </p>
                </div>



                {/* Main Interactive Display area */}
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-4 md:p-8 grid lg:grid-cols-12 gap-8 shadow-2xl relative overflow-hidden">
                    {/* Background blob for the container */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[100px] pointer-events-none" />

                    {/* Left Side: Accordion/Selection List */}
                    <div className="lg:col-span-4 flex flex-col justify-center space-y-2">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.id}
                                onClick={() => setActiveFeatureIndex(index)}
                                className={cn(
                                    "relative p-6 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group",
                                    activeFeatureIndex === index ? "bg-white/5" : "hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="space-y-4">
                                        <h3 className={cn(
                                            "text-xl font-bold flex items-center gap-3 transition-colors",
                                            activeFeatureIndex === index ? "text-green-400" : "text-white group-hover:text-green-300"
                                        )}>
                                            {feature.title}
                                            {activeFeatureIndex === index && (
                                                <motion.span layoutId="active-dot" className="w-2 h-2 rounded-full bg-green-500" />
                                            )}
                                        </h3>

                                        <AnimatePresence>
                                            {activeFeatureIndex === index && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="text-slate-400 text-sm leading-relaxed"
                                                >
                                                    {feature.fullDesc}
                                                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
                                                        {feature.details.map((detail, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-slate-300">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                {detail}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Button Removed */}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <ChevronRight className={cn(
                                        "w-5 h-5 transition-transform duration-300",
                                        activeFeatureIndex === index ? "rotate-90 text-green-400" : "text-slate-500"
                                    )} />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Right Side: Dynamic Image/Preview Area */}
                    <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-white/10 relative overflow-hidden aspect-[4/3] flex items-center justify-center">
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
                                        <HeroDashboardPreview className="w-full h-full min-h-0 shadow-none border-none bg-slate-950 rounded-none" />
                                    </div>
                                ) : features[activeFeatureIndex].id === 'analytics' ? (
                                    <div className="absolute inset-0 w-[133.33%] h-[133.33%] transform scale-[0.75] origin-top-left">
                                        <AnalyticsPreview className="w-full h-full min-h-0 shadow-none border-none bg-slate-950 rounded-none" />
                                    </div>
                                ) : (
                                    <img
                                        src={features[activeFeatureIndex].image}
                                        alt={features[activeFeatureIndex].title}
                                        className="w-full h-auto rounded-xl shadow-2xl border border-white/10 object-contain hover:scale-105 transition-transform duration-500"
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
