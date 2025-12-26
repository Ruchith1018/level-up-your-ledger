import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Trophy, Users, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
    id: string;
    title: string;
    shortDesc: string;
    fullDesc: string;
    icon: React.ElementType;
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
        imageGradient: 'from-blue-600 to-indigo-600',
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
        imageGradient: 'from-emerald-500 to-green-600',
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
        imageGradient: 'from-orange-500 to-amber-500',
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
        imageGradient: 'from-pink-500 to-rose-500',
        details: [
            'Shared wallets',
            'Family budget limits',
            'Activity notifications',
            'Role-based access'
        ]
    }
];

export const FeaturesSection = () => {
    const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

    return (
        <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">

                {/* Header */}
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        Power-packed features for <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">smarter financial decisions</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Everything you need to take control of your money, gamify your savings, and build wealth together.
                    </p>
                </div>

                {/* Top Features Grid (Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {features.map((feature, index) => (
                        <div
                            key={feature.id}
                            onClick={() => setActiveFeatureIndex(index)}
                            className={cn(
                                "group cursor-pointer p-6 rounded-2xl border transition-all duration-300",
                                activeFeatureIndex === index
                                    ? "bg-slate-900 border-blue-500/50 shadow-lg shadow-blue-500/10"
                                    : "bg-slate-900/50 border-white/5 hover:bg-slate-900 hover:border-white/10"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors",
                                activeFeatureIndex === index ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-400 group-hover:text-blue-400"
                            )}>
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className={cn("text-lg font-bold mb-2", activeFeatureIndex === index ? "text-white" : "text-slate-200")}>
                                {feature.title}
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {feature.shortDesc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Main Interactive Display area */}
                <div className="bg-slate-900 border border-white/5 rounded-3xl p-4 md:p-8 grid lg:grid-cols-12 gap-8 shadow-2xl relative overflow-hidden">
                    {/* Background blob for the container */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

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
                                            activeFeatureIndex === index ? "text-blue-400" : "text-white group-hover:text-blue-300"
                                        )}>
                                            {feature.title}
                                            {activeFeatureIndex === index && (
                                                <motion.span layoutId="active-dot" className="w-2 h-2 rounded-full bg-blue-500" />
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
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                {detail}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button className="mt-6 flex items-center gap-2 text-white font-medium hover:gap-3 transition-all">
                                                        Learn more <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <ChevronRight className={cn(
                                        "w-5 h-5 transition-transform duration-300",
                                        activeFeatureIndex === index ? "rotate-90 text-blue-400" : "text-slate-500"
                                    )} />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Right Side: Dynamic Image/Preview Area */}
                    <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-white/10 relative overflow-hidden aspect-[4/3] lg:aspect-auto min-h-[400px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeFeatureIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.4 }}
                                className={cn(
                                    "absolute inset-0 bg-gradient-to-br flex items-center justify-center p-8",
                                    features[activeFeatureIndex].imageGradient
                                )}
                            >
                                {/* Placeholder Mockup Content */}
                                <div className="w-full h-full bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden flex flex-col relative">
                                    {/* Mock Window Header */}
                                    <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/20" />
                                        <div className="ml-4 h-4 w-32 bg-white/10 rounded-full" />
                                    </div>

                                    {/* Mock Content Body */}
                                    <div className="flex-1 p-6 relative">

                                        {/* Dynamic Content based on feature */}
                                        <div className="absolute inset-x-6 top-6 bottom-6 flex flex-col gap-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <div className="h-8 w-48 bg-white/10 rounded-lg mb-2" />
                                                    <div className="h-4 w-32 bg-white/5 rounded-lg" />
                                                </div>
                                                <div className="h-10 w-10 rounded-full bg-white/10" />
                                            </div>

                                            {/* Abstract Charts/Data */}
                                            <div className="flex-1 grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 rounded-lg p-4 flex flex-col justify-end">
                                                    <div className="space-y-2">
                                                        <div className="w-full h-24 bg-gradient-to-t from-blue-500/50 to-transparent rounded-sm" />
                                                        <div className="h-2 w-16 bg-white/10 rounded-full" />
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-4 flex flex-col gap-3">
                                                    <div className="h-2 w-full bg-white/10 rounded-full" />
                                                    <div className="h-2 w-[80%] bg-white/10 rounded-full" />
                                                    <div className="h-2 w-[60%] bg-white/10 rounded-full" />
                                                    <div className="mt-auto h-20 w-20 rounded-full border-4 border-blue-500/30 mx-auto" />
                                                </div>
                                            </div>

                                            {/* Feature Specific Decoration */}
                                            <div className="absolute bottom-4 right-4">
                                                {React.createElement(features[activeFeatureIndex].icon, {
                                                    className: "w-32 h-32 text-white/5 rotate-12"
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};
