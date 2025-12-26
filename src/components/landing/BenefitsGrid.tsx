import React from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    ShieldCheck,
    Target,
    Gift,
    Coins,
    TrendingUp,
    Sparkles,
    Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const BenefitsGrid = () => {
    return (
        <section id="benefits" className="py-24 bg-slate-950 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
                    >
                        Why Choose <span className="text-green-400">BudGlio</span>?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-lg max-w-2xl mx-auto"
                    >
                        Experience a new way of managing money that rewards you for every smart decision.
                    </motion.p>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-8 md:p-12 max-w-7xl mx-auto shadow-2xl backdrop-blur-sm relative overflow-hidden">
                    {/* Inner Background Blob */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        {/* Item 1: Family (Large) */}
                        <BentoCard
                            className="md:col-span-2 bg-gradient-to-br from-blue-900/20 to-slate-900 border-blue-500/20"
                            iconImage="/assets/benefits/family.png"
                            title="One App for the Entire Family"
                            description="Collaborate on budgets, share expenses, and track household goals in one unified space. Sync effortlessly with your partner and kids."
                            gradient="bg-blue-500/10"
                        >

                        </BentoCard>

                        {/* Item 2: Security */}
                        <BentoCard
                            className="md:col-span-1 bg-gradient-to-br from-emerald-900/20 to-slate-900 border-emerald-500/20"
                            iconImage="/assets/benefits/protection.png"
                            title="Fully Protected"
                            description="Your financial data is secured with bank-grade encryption and biometric locks."
                            gradient="bg-emerald-500/10"
                        />

                        {/* Item 3: Referrals */}
                        <BentoCard
                            className="md:col-span-1 bg-gradient-to-br from-yellow-900/20 to-slate-900 border-yellow-500/20"
                            iconImage="/assets/benefits/referral.png"
                            title="Referral Bonus"
                            description="Invite friends to level up their ledger and earn massive coin bonuses together."
                            gradient="bg-yellow-500/10"
                        />

                        {/* Item 4: Goals (Large) */}
                        <BentoCard
                            className="md:col-span-2 bg-gradient-to-br from-purple-900/20 to-slate-900 border-purple-500/20"
                            iconImage="/assets/benefits/goals.png"
                            title="Achieve Goals Together"
                            description="Set shared targets for vacations, new gadgets, or emergency funds. visual progress bars keep everyone motivated."
                            gradient="bg-purple-500/10"
                        >

                        </BentoCard>

                        {/* Item 5: Analytics (Large) - Swapped to Left */}
                        <BentoCard
                            className="md:col-span-2 bg-gradient-to-br from-indigo-900/20 to-slate-900 border-indigo-500/20"
                            iconImage="/assets/benefits/analytics.png"
                            title="Premium Level Analytics"
                            description="Unlock deep insights with Elite Agent status. Visualize cash flow, category breakdowns, and future projections."
                            gradient="bg-indigo-500/10"
                        >

                        </BentoCard>

                        {/* Item 6: Rewards (Small) - Swapped to Right */}
                        <BentoCard
                            className="md:col-span-1 bg-gradient-to-br from-orange-900/20 to-slate-900 border-orange-500/20"
                            iconImage="/assets/benefits/rewards.png"
                            title="Rewards Redeem"
                            description="Turn your savings streaks into real-world rewards. Shop with earned coins."
                            gradient="bg-orange-500/10"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

const BentoCard = ({
    className,
    icon,
    iconImage,
    title,
    description,
    gradient,
    children
}: {
    className?: string;
    icon?: React.ReactNode;
    iconImage?: string;
    title: string;
    description: string;
    gradient?: string;
    children?: React.ReactNode;
    image?: string;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "relative p-8 rounded-3xl border flex flex-col justify-start overflow-hidden group hover:shadow-2xl transition-all",
                className
            )}
        >
            {/* Hover Glow */}
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", gradient)} />

            {/* Content */}
            <div className="relative z-10">
                <div className="mb-4 w-fit">
                    {iconImage ? (
                        <div className="bg-white p-2 rounded-2xl shadow-lg border border-white/10 w-16 h-16 flex items-center justify-center">
                            <img src={iconImage} alt={title} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5 backdrop-blur-sm">
                            {icon}
                        </div>
                    )}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm md:text-base">{description}</p>
            </div>

            {/* Decorative Children */}
            {children}
        </motion.div>
    );
};
