import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PiggyBank, Target, ChevronRight, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const FamilyFeaturePreview = ({ className }: { className?: string }) => {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.1 });

    // --- State for Budget Simulation ---
    const budgetLimit = 500;
    const [spent, setSpent] = useState(320); // Start partially filled
    const [isCelebration, setIsCelebration] = useState(false);
    const [month, setMonth] = useState('January 2026');

    // --- State for Stats ---
    const [stats, setStats] = useState({
        raised: 500,
        spent: 0,
        usage: 64.0
    });

    // --- State for Activity Feed ---
    const [activities, setActivities] = useState([
        { id: 1, user: 'Adam', action: 'contributed', amount: 500, time: '1/3/2026', avatar: 'A', color: 'bg-indigo-500' },
    ]);

    // --- State for Family Members ---
    const [members, setMembers] = useState([
        { id: '1', name: 'Adam', role: 'Admin', initials: 'AD', color: 'bg-slate-800', isNew: false }
    ]);

    const POTENTIAL_MEMBERS = [
        { id: 'p1', name: 'Sarah', role: 'Partner', initials: 'SA', color: 'bg-pink-900' },
        { id: 'p2', name: 'Mike', role: 'Child', initials: 'MI', color: 'bg-blue-900' },
        { id: 'p3', name: 'Emma', role: 'Child', initials: 'EM', color: 'bg-purple-900' },
        { id: 'p4', name: 'Grandma', role: 'Grandparent', initials: 'GR', color: 'bg-emerald-900' },
    ];


    // --- Simulation Loop ---
    useEffect(() => {
        if (!isInView) return;

        let interval: NodeJS.Timeout;

        const runSimulation = () => {
            setSpent(prevSpent => {
                // If celebration mode, hold value
                if (isCelebration) return prevSpent;

                // Random small increment
                const increment = Math.floor(Math.random() * 40) + 10;
                let newSpent = prevSpent + increment;

                // Add Activity
                const spender = members[Math.floor(Math.random() * members.length)];
                if (spender) {
                    const newActivity = {
                        id: Date.now(),
                        user: spender.name,
                        action: 'spent',
                        amount: increment,
                        time: 'Just now',
                        avatar: spender.initials[0],
                        color: spender.color.replace('900', '500') // Brighter for avatar
                    };
                    setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
                }

                // Check for completion
                if (newSpent >= budgetLimit) {
                    newSpent = budgetLimit;
                    triggerCelebration();
                }

                // Update Stats
                setStats(prev => ({
                    ...prev,
                    spent: newSpent,
                    usage: (newSpent / budgetLimit) * 100
                }));

                return newSpent;
            });
        };

        const triggerCelebration = () => {
            setIsCelebration(true);
            setTimeout(() => {
                resetSimulation();
            }, 4000); // 4 seconds celebration
        };

        const resetSimulation = () => {
            setIsCelebration(false);
            setSpent(0);
            setStats({ raised: 500, spent: 0, usage: 0 });
            setActivities([{ id: Date.now(), user: 'App', action: 'Budget Reset', amount: 0, time: 'Just now', avatar: 'B', color: 'bg-green-500' }]);

            const months = ['January', 'February', 'March', 'April', 'May', 'June'];
            const currentMonthIdx = months.findIndex(m => month.startsWith(m));
            const nextMonth = months[(currentMonthIdx + 1) % months.length];
            setMonth(`${nextMonth} 2026`);
        };

        if (!isCelebration) {
            interval = setInterval(runSimulation, 1200);
        }

        return () => clearInterval(interval);
    }, [isInView, isCelebration, month, members]);


    // Dynamic Member Join Simulation
    useEffect(() => {
        if (!isInView) return;

        const memberInterval = setInterval(() => {
            // Toggle members logic
            setMembers(prev => {
                const isAdding = Math.random() > 0.4;

                if (isAdding && prev.length < 4) {
                    // Find a member not currently in the list
                    const available = POTENTIAL_MEMBERS.filter(p => !prev.find(m => m.name === p.name));
                    if (available.length > 0) {
                        const newMember = available[Math.floor(Math.random() * available.length)];
                        return [...prev, { ...newMember, isNew: true }];
                    }
                } else if (!isAdding && prev.length > 1) {
                    // Remove last added (non-admin)
                    const removable = prev.filter(m => m.role !== 'Admin');
                    if (removable.length > 0) {
                        const toRemove = removable[removable.length - 1]; // Remove last one
                        return prev.filter(m => m.id !== toRemove.id);
                    }
                }
                return prev;
            });
        }, 3500);

        return () => clearInterval(memberInterval);
    }, [isInView]);


    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div ref={containerRef} className={cn("w-full h-auto min-h-[600px] bg-slate-950 rounded-xl overflow-hidden border border-white/10 shadow-2xl flex flex-col font-sans transition-all duration-500 group relative", className)}>

            {/* --- macOS Header --- */}
            <div className="h-8 bg-slate-900 border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                <div className="flex-1 flex justify-center px-2">
                    <div className="h-5 bg-slate-800 rounded flex items-center px-2 opacity-50 w-full max-w-sm justify-center">
                        <div className="text-[10px] text-slate-400 font-medium">budglio.in/family</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 grid grid-cols-12 gap-6 bg-slate-950 text-white overflow-hidden relative">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />

                {/* Left Column */}
                <div className="col-span-12 md:col-span-7 flex flex-col gap-6">

                    {/* Hero Card: Monthly Budget */}
                    <Card className="bg-slate-900 border-white/10 shadow-xl relative overflow-hidden group/card min-h-[220px] flex flex-col justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <AnimatePresence mode="wait">
                            {isCelebration ? (
                                <motion.div
                                    key="celebration"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-900/95"
                                >
                                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 mb-3">
                                        That's a wrap for {month.split(' ')[0]}!
                                    </h3>
                                    <p className="text-slate-400 max-w-xs leading-relaxed">
                                        You and your family stayed on track. <br /> Getting ready for next month...
                                    </p>
                                    <div className="mt-6 flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0s' }} />
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="content" className="relative z-10 w-full">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex justify-between items-center text-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                                                    <PiggyBank className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-lg font-bold">Monthly Budget</div>
                                                    <div className="text-xs text-slate-400 font-normal">{month}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-bold uppercase tracking-wider">Active</span>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Budget Progress */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm text-slate-400">Remaining</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={cn("text-2xl font-bold transition-colors duration-300", spent >= budgetLimit ? "text-red-400" : "text-green-400")}>
                                                        ₹{budgetLimit - spent}
                                                    </span>
                                                    <span className="text-sm text-slate-500">/ ₹{budgetLimit}</span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={cn("h-full rounded-full transition-colors duration-300",
                                                        spent >= budgetLimit * 0.9 ? "bg-red-500" : "bg-blue-600"
                                                    )}
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: `${(spent / budgetLimit) * 100}%` }}
                                                    transition={{ type: "tween", ease: "linear", duration: 0.8 }}
                                                />
                                            </div>
                                        </div>

                                        {/* Spending Limit Card */}
                                        <div className="bg-blue-900/10 rounded-xl p-4 border border-blue-500/10">
                                            <div className="flex items-center gap-2 text-sm text-slate-300 mb-1">
                                                <div className="w-1 h-3 bg-green-500 rounded-full" />
                                                Family Limit
                                            </div>
                                            <div className="text-2xl font-bold text-white mb-1">₹500</div>
                                            <div className="text-xs text-slate-400">Total Budget set by Admin</div>
                                        </div>
                                    </CardContent>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>

                    {/* Recent Activity Feed */}
                    <Card className="bg-slate-900 border-white/10 shadow-lg flex-1 min-h-[220px] overflow-hidden flex flex-col">
                        <CardHeader className="pb-2 shrink-0">
                            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-slate-400" />
                                    Live Updates
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2 relative flex-1 overflow-hidden">
                            <div className="space-y-3">
                                <AnimatePresence mode='popLayout'>
                                    {activities.map((activity) => (
                                        <motion.div
                                            key={activity.id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-white/5"
                                        >
                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", activity.color)}>
                                                {activity.avatar}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-200 truncate">
                                                    <span className="font-bold">{activity.user}</span> {activity.action}
                                                </div>
                                                <div className="text-xs text-slate-400">{activity.time}</div>
                                            </div>
                                            <div className={cn("text-sm font-bold shrink-0", activity.action === 'Budget Reset' ? "text-blue-400" : "text-red-400")}>
                                                {activity.amount > 0 ? `+₹${activity.amount}` : ''}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="col-span-12 md:col-span-5 flex flex-col gap-4">

                    {/* Lifetime Stats Card */}
                    <Card className="bg-slate-900 border-white/10 shadow-lg">
                        <CardHeader className="pb-3 pt-5">
                            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Lifetime Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Raised */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Raised</span>
                                    <span className="font-bold text-green-400">{formatCurrency(stats.raised)}</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-emerald-500 rounded-full"
                                        initial={{ width: "100%" }}
                                        animate={{ width: "100%" }}
                                    />
                                </div>
                            </div>

                            {/* Spent */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-blue-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full" /> Spent</span>
                                    <span className="font-bold text-red-400">₹{stats.spent}</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-blue-600 rounded-full"
                                        animate={{ width: `${stats.usage}%` }}
                                        transition={{ type: "tween", ease: "linear", duration: 0.5 }}
                                    />
                                </div>
                                <div className="text-right text-[10px] text-slate-500">
                                    {stats.usage.toFixed(1)}% Usage
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Family Savings Link */}
                    <Card className="bg-slate-900 border-white/10 shadow-lg hover:border-indigo-500/50 transition-colors cursor-pointer group">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold">
                                    <PiggyBank className="w-4 h-4" />
                                    Family Savings
                                </div>
                                <div className="text-xs text-slate-400">Manage contributions and goals</div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Family Members */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3 pl-1 flex items-center justify-between">
                            Family Members
                            <AnimatePresence>
                                {members.some(m => m.isNew) && (
                                    <motion.span
                                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                        className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full"
                                    >
                                        Updated
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </h3>
                        <Card className="bg-slate-900 border-white/10 shadow-lg min-h-[140px]">
                            <CardContent className="p-4 space-y-3">
                                <AnimatePresence mode='popLayout'>
                                    {members.map((member) => (
                                        <motion.div
                                            key={member.id}
                                            layout
                                            initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                            exit={{ opacity: 0, height: 0, scale: 0.9 }}
                                            className="flex items-center gap-3 overflow-hidden"
                                        >
                                            <div className={cn("w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0", member.color)}>
                                                {member.initials}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white">{member.name}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20 font-medium">{member.role}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </div>

                </div>

            </div>
        </div>
    );
};
