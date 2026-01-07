import React, { useEffect, useRef, useState } from 'react';
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

const BENEFITS = [
    {
        iconImage: "/assets/benefits/family.png",
        title: "One App for the Entire Family",
        description: "Collaborate on budgets, share expenses, and track household goals in one unified space. Sync effortlessly with your partner and kids.",
        gradient: "bg-blue-500/10",
        className: "bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900 border-blue-100 dark:border-blue-500/20"
    },
    {
        iconImage: "/assets/benefits/protection.png",
        title: "Fully Protected",
        description: "Your financial data is secured with bank-grade encryption and biometric locks.",
        gradient: "bg-emerald-500/10",
        className: "bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900 border-emerald-100 dark:border-emerald-500/20"
    },
    {
        iconImage: "/assets/benefits/referral.png",
        title: "Referral Bonus",
        description: "Invite friends to level up their ledger and earn massive coin bonuses together.",
        gradient: "bg-yellow-500/10",
        className: "bg-gradient-to-br from-amber-50 to-white dark:from-yellow-900/20 dark:to-slate-900 border-amber-100 dark:border-yellow-500/20"
    },
    {
        iconImage: "/assets/benefits/goals.png",
        title: "Achieve Goals Together",
        description: "Set shared targets for vacations, new gadgets, or emergency funds. visual progress bars keep everyone motivated.",
        gradient: "bg-purple-500/10",
        className: "bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900 border-purple-100 dark:border-purple-500/20"
    },
    {
        iconImage: "/assets/benefits/analytics.png",
        title: "Premium Level Analytics",
        description: "Unlock deep insights with Elite Agent status. Visualize cash flow, category breakdowns, and future projections.",
        gradient: "bg-indigo-500/10",
        className: "bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900 border-indigo-100 dark:border-indigo-500/20"
    },
    {
        iconImage: "/assets/benefits/rewards.png",
        title: "Rewards Redeem",
        description: "Turn your savings streaks into real-world rewards. Shop with earned coins.",
        gradient: "bg-orange-500/10",
        className: "bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900 border-orange-100 dark:border-orange-500/20"
    }
];

export const BenefitsGrid = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isMobile, setIsMobile] = useState(() => {
        // Initialize with proper check to avoid delay
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
        }
        return false;
    });

    // Detect mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const scroller = scrollRef.current;
        if (!scroller || !isMobile) return; // Only run on mobile

        let animationId: number;
        const speed = 1.5; // Increased pixels per frame for more visible scrolling

        const step = () => {
            if (!isPaused && scroller) {
                // Check if we've scrolled to the halfway point (where duplicated content starts)
                const maxScroll = scroller.scrollWidth - scroller.clientWidth;
                const resetPoint = maxScroll / 2;

                if (scroller.scrollLeft >= resetPoint) {
                    scroller.scrollLeft = 0; // Seamless reset
                } else {
                    scroller.scrollLeft += speed;
                }
            }

            animationId = requestAnimationFrame(step);
        };

        // Start animation immediately
        animationId = requestAnimationFrame(step);

        return () => cancelAnimationFrame(animationId);
    }, [isPaused, isMobile]);

    return (
        <section id="benefits" className="py-24 bg-background dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
            {/* Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-foreground dark:text-white"
                    >
                        Why Choose <span className="text-green-600 dark:text-green-400">BudGlio</span>?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground dark:text-slate-400 text-lg max-w-2xl mx-auto"
                    >
                        Experience a new way of managing money that rewards you for every smart decision.
                    </motion.p>
                </div>

                <div className="bg-card/50 dark:bg-slate-900/50 border border-border/10 dark:border-white/5 rounded-[3rem] p-8 md:p-12 max-w-7xl mx-auto shadow-2xl backdrop-blur-sm relative overflow-hidden transition-colors duration-300">
                    {/* Inner Background Blob */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                    {/* Mobile Auto-Scroll Container */}
                    <div
                        className="md:hidden relative"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        onTouchStart={() => setIsPaused(true)}
                        onTouchEnd={() => setIsPaused(false)}
                        onTouchCancel={() => setIsPaused(false)}
                    >
                        {/* Fade Masks */}
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-card/50 dark:from-slate-900/50 to-transparent z-20 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-card/50 dark:from-slate-900/50 to-transparent z-20 pointer-events-none" />

                        <div
                            ref={scrollRef}
                            className="flex gap-4 overflow-x-auto scrollbar-hide pb-6 relative z-10"
                            style={{ scrollBehavior: 'auto' }}
                        >
                            {/* Triple render for infinite loop */}
                            {[...BENEFITS, ...BENEFITS, ...BENEFITS].map((benefit, idx) => (
                                <BentoCard
                                    key={idx}
                                    className={cn("w-full snap-center shrink-0 cursor-grab active:cursor-grabbing", benefit.className)}
                                    iconImage={benefit.iconImage}
                                    title={benefit.title}
                                    description={benefit.description}
                                    gradient={benefit.gradient}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Desktop Grid (unchanged) */}
                    <div className="hidden md:grid md:grid-cols-3 gap-6 relative z-10">
                        {BENEFITS.map((benefit, idx) => (
                            <BentoCard
                                key={idx}
                                className={cn(
                                    "snap-center",
                                    idx === 0 && "md:col-span-2",
                                    idx === 3 && "md:col-span-2",
                                    idx === 4 && "md:col-span-2",
                                    benefit.className
                                )}
                                iconImage={benefit.iconImage}
                                title={benefit.title}
                                description={benefit.description}
                                gradient={benefit.gradient}
                            />
                        ))}
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
                "relative p-8 rounded-3xl border flex flex-col justify-start overflow-hidden group hover:shadow-2xl transition-all shadow-sm",
                className
            )}
        >
            {/* Hover Glow */}
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", gradient)} />

            {/* Content */}
            <div className="relative z-10 text-left">
                <div className="mb-4 w-fit">
                    {iconImage ? (
                        <div className="bg-white p-2 rounded-2xl shadow-lg border border-border/10 w-16 h-16 flex items-center justify-center">
                            <img src={iconImage} alt={title} className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-950/50 p-3 rounded-2xl border border-border/10 dark:border-white/5 backdrop-blur-sm shadow-sm">
                            {icon}
                        </div>
                    )}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground dark:text-white mb-3 text-wrap break-words">{title}</h3>
                <p className="text-muted-foreground dark:text-slate-400 leading-relaxed text-sm md:text-base text-wrap break-words">{description}</p>
            </div>

            {/* Decorative Children */}
            {children}
        </motion.div>
    );
};
