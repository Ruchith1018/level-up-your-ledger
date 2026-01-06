import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, CreditCard, ChevronDown, Bell, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export const HeroDashboardPreview = ({ className }: { className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { amount: 0.1 });
    const [scale, setScale] = useState(1);
    const [containerHeight, setContainerHeight] = useState<number | 'auto'>('auto');

    // Handle Auto-Scaling for Mobile "Mini Window" look
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && contentRef.current && window.innerWidth < 1024) { // Only scale on mobile/tablet
                const containerWidth = containerRef.current.offsetWidth;
                const baseWidth = 1200; // The "ideal" width of the dashboard we are shrinking
                // Calculate scale but cap it at 1
                const newScale = Math.min(containerWidth / baseWidth, 1);
                setScale(newScale);

                // Calculate dynamic height based on the scaled content
                // We need to wait for render layout, but roughly:
                const contentHeight = contentRef.current.offsetHeight || 800; // Fallback
                setContainerHeight(contentHeight * newScale);

            } else {
                setScale(1); // Reset on desktop
                setContainerHeight('auto');
            }
        };

        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- State for Animation ---
    const [balance, setBalance] = useState(95670.26);
    const [expenses, setExpenses] = useState(4366.18);
    const [savings, setSavings] = useState(1200.00);
    const [activeMonth, setActiveMonth] = useState('December 2025');

    // Chart Data State
    const [spendingData, setSpendingData] = useState([
        { name: 'Entertainment', value: 400, color: '#3b82f6' }, // Blue
        { name: 'Other', value: 300, color: '#60a5fa' }, // Light Blue
        { name: 'Travel', value: 300, color: '#2563eb' }, // Dark Blue
        { name: 'Education', value: 200, color: '#facc15' }, // Yellow
        { name: 'Shopping', value: 900, color: '#f97316' }, // Orange
    ]);

    const [trendData, setTrendData] = useState([
        { name: 'Jul', income: 4000, expenses: 2400 },
        { name: 'Aug', income: 3000, expenses: 1398 },
        { name: 'Sep', income: 2000, expenses: 9800 },
        { name: 'Oct', income: 2780, expenses: 3908 },
        { name: 'Nov', income: 1890, expenses: 4800 },
        { name: 'Dec', income: 2390, expenses: 3800 },
    ]);

    // Use ref for stable access to balance inside interval without resetting the effect
    const balanceRef = useRef(balance);
    useEffect(() => {
        balanceRef.current = balance;
    }, [balance]);

    // --- Simulation Effect ---
    useEffect(() => {
        // Pauses simulation if not in view to save resources
        if (!isInView) return;

        const interval = setInterval(() => {
            const currentBalance = balanceRef.current;

            // Loop Reset Condition (Data Inconsistency Check)
            if (currentBalance < 80000) {
                setBalance(95670.26);
                setExpenses(4366.18);
                setSavings(1200.00);
                setSpendingData([
                    { name: 'Entertainment', value: 400, color: '#3b82f6' },
                    { name: 'Other', value: 300, color: '#60a5fa' },
                    { name: 'Travel', value: 300, color: '#2563eb' },
                    { name: 'Education', value: 200, color: '#facc15' },
                    { name: 'Shopping', value: 900, color: '#f97316' },
                ]);
                setTrendData([
                    { name: 'Jul', income: 4000, expenses: 2400 },
                    { name: 'Aug', income: 3000, expenses: 1398 },
                    { name: 'Sep', income: 2000, expenses: 9800 },
                    { name: 'Oct', income: 2780, expenses: 3908 },
                    { name: 'Nov', income: 1890, expenses: 4800 },
                    { name: 'Dec', income: 2390, expenses: 3800 },
                ]);
                return;
            }

            // Randomly decrease balance / increase expenses
            const amount = Math.floor(Math.random() * 500) + 50;

            setBalance(prev => Math.max(0, prev - amount));
            setExpenses(prev => prev + amount);
            setSavings(prev => prev + (Math.random() > 0.5 ? amount * 0.2 : -amount * 0.1)); // Dynamic savings

            // Update Charts randomly & Increment All Categories
            setSpendingData(prev => {
                return prev.map(item => {
                    // 70% chance to increase each category to make "all categories move"
                    if (Math.random() > 0.3) {
                        return {
                            ...item,
                            value: item.value + Math.floor(Math.random() * 100) + 20
                        };
                    }
                    return item;
                });
            });

            setTrendData(prev => {
                const newData = [...prev];
                const lastItem = newData[newData.length - 1];
                newData[newData.length - 1] = {
                    ...lastItem,
                    expenses: lastItem.expenses + amount
                };
                return newData;
            });

        }, 800); // Update every 0.8 seconds

        return () => clearInterval(interval);
    }, [isInView]); // Removed balance dependency to prevent effect churn

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(value);
    };

    // Helper to get category data
    const getCategoryData = (name: string, max: number) => {
        const item = spendingData.find(d => d.name === name) || { value: 0, color: '' };
        const value = item.value;
        const percentage = Math.min(100, (value / max) * 100);
        const isOverBudget = value > max;

        return { value, percentage, isOverBudget, color: isOverBudget ? 'bg-red-500' : item.color };
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "w-full bg-background dark:bg-slate-950 rounded-xl border border-border/10 dark:border-white/10 shadow-2xl flex flex-col font-sans transition-all duration-500 group text-foreground overflow-hidden",
                // Mobile: Remove Aspect Ratio, use dynamic height
                "lg:h-auto lg:min-h-[600px]",
                className
            )}
            style={{
                height: containerHeight === 'auto' ? '100%' : `${containerHeight}px`,
            }}
        >
            {/* Scaling Wrapper */}
            <div
                ref={contentRef}
                className="lg:w-full lg:h-full origin-top-left"
                style={{
                    width: window.innerWidth < 1024 ? '1200px' : '100%', // Force 1200px width on mobile to render full layout
                    transform: window.innerWidth < 1024 ? `scale(${scale})` : 'none',
                    height: window.innerWidth < 1024 ? 'auto' : '100%' // Let content dictate height
                }}
            >


                {/* --- macOS Header --- */}
                <div className="h-8 bg-muted/40 dark:bg-slate-900 border-b border-border/10 dark:border-white/5 flex items-center px-4 gap-2 shrink-0 transition-colors duration-300">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]" />

                    {/* Simulated Address Bar */}
                    <div className="flex-1 flex justify-center px-2">
                        <div className="h-5 bg-background dark:bg-slate-800 rounded flex items-center px-2 opacity-50 w-full max-w-sm justify-center border border-border/5">
                            <div className="text-[10px] text-muted-foreground dark:text-slate-400 font-medium">budglio.in/dashboard</div>
                        </div>
                    </div>

                    {/* Top Right Stats */}
                    <div className="ml-auto flex items-center gap-4 text-[10px] text-muted-foreground dark:text-slate-400">
                        <div className="flex items-center gap-1.5 bg-background dark:bg-slate-800 px-2 py-1 rounded-full border border-border/10 dark:border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span>Live</span>
                        </div>
                    </div>
                </div>

                {/* --- Main Dashboard Content --- */}
                <div className="flex-1 p-4 lg:p-6 grid grid-cols-12 gap-4 lg:gap-6 overflow-hidden">

                    {/* --- Top Row --- */}

                    {/* 1. Budget Card (Col 5) */}
                    <div className="col-span-5 flex flex-col gap-4">
                        <Card className="bg-card dark:bg-slate-900 border-border/10 dark:border-white/10 shadow-lg relative overflow-hidden group/card transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 transition-opacity duration-500 pointer-events-none" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-foreground dark:text-slate-200 text-lg flex justify-between items-center">
                                    <span>Budget Overview</span>
                                    <Wallet className="w-4 h-4 text-muted-foreground dark:text-slate-500" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Blue Hero Card Replica */}
                                <div className="w-full aspect-[1.586/1] rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 p-5 shadow-xl relative overflow-hidden transform transition-transform duration-500 group/card-inner">
                                    {/* Diagonal Lines Pattern Overlay */}
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(135deg, #ffffff 10%, transparent 10%, transparent 50%, #ffffff 50%, #ffffff 60%, transparent 60%, transparent 100%)', backgroundSize: '10px 10px' }} />

                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="text-white/90 font-bold tracking-wider text-sm">BudGlio Card</div>
                                        <div className="flex gap-2">
                                            <CreditCard className="w-4 h-4 text-white/70" />
                                            <Zap className="w-4 h-4 text-white/70" />
                                        </div>
                                    </div>

                                    {/* Chip & Contactless */}
                                    <div className="mb-4 relative z-10">
                                        <div className="w-10 h-8 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center border border-yellow-600/30 overflow-hidden relative shadow-sm">
                                            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-yellow-700/40"></div>
                                            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-yellow-700/40"></div>
                                            <div className="absolute inset-0 border-[2px] border-transparent border-t-yellow-700/20 border-b-yellow-700/20 rounded-sm"></div>
                                        </div>
                                    </div>

                                    {/* Balance */}
                                    <div className="space-y-0.5 relative z-10 mb-4">
                                        <div className="text-[9px] text-blue-200 font-semibold uppercase tracking-widest">Remaining Balance</div>
                                        <div
                                            className="text-2xl md:text-3xl font-mono font-bold text-white tracking-tight truncate"
                                        >
                                            {formatCurrency(balance)}
                                        </div>
                                    </div>

                                    {/* Bottom Details */}
                                    <div className="flex justify-between items-end relative z-10">
                                        <div className="space-y-0.5">
                                            <div className="text-[8px] text-blue-300 font-semibold tracking-wider">CARD HOLDER</div>
                                            <div className="text-sm font-bold text-white tracking-widest uppercase">HERO</div>
                                        </div>
                                        <div className="text-right space-y-0.5">
                                            <div className="text-[8px] text-blue-300 font-semibold tracking-wider">ISSUED</div>
                                            <div className="text-xs font-mono text-white/90">12/25</div>
                                        </div>
                                    </div>

                                    {/* Progress Bar at Bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-950">
                                        <motion.div
                                            className="h-full bg-emerald-400"
                                            initial={{ width: "30%" }}
                                            animate={{ width: `${(balance / 150000) * 100}%` }}
                                            transition={{ duration: 1 }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/40 dark:bg-slate-900/50 rounded-xl p-4 border border-border/10 dark:border-white/5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2 text-red-500 dark:text-red-400">
                                    <div className="p-1.5 bg-red-500/10 rounded-md"><TrendingDown className="w-3 h-3" /></div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Expenses</span>
                                </div>
                                <motion.div
                                    key={expenses}
                                    className="text-lg font-bold text-foreground dark:text-white tabular-nums"
                                >
                                    {formatCurrency(expenses)}
                                </motion.div>
                            </div>
                            <div className="bg-muted/40 dark:bg-slate-900/50 rounded-xl p-4 border border-border/10 dark:border-white/5 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                                    <div className="p-1.5 bg-emerald-500/10 rounded-md"><TrendingUp className="w-3 h-3" /></div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Savings</span>
                                </div>
                                <div className="text-lg font-bold text-foreground dark:text-white tabular-nums">{formatCurrency(savings)}</div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Category Budgets (Col 7) */}
                    <div className="col-span-7 bg-card dark:bg-slate-900 rounded-xl border border-border/10 dark:border-white/10 p-5 shadow-lg flex flex-col transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-foreground dark:text-white">Category Budgets</h3>
                            <div className="text-xs text-muted-foreground dark:text-slate-500 bg-muted dark:bg-slate-800 px-2 py-1 rounded-md border border-border/5 dark:border-white/5">This Month</div>
                        </div>

                        <div className="space-y-6 flex-1">
                            {/* Food */}
                            {(() => {
                                const { value, percentage, isOverBudget, color } = getCategoryData('Other', 600); // Mapped 'Other' to Food for demo
                                return (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground dark:text-slate-300">Food & Dining</span>
                                            <span className={cn("text-muted-foreground dark:text-slate-400", isOverBudget && "text-red-500 dark:text-red-400 font-bold")}>
                                                {formatCurrency(value)} / {formatCurrency(600)}
                                            </span>
                                        </div>
                                        <Progress value={percentage} className="h-2 bg-muted dark:bg-slate-800" indicatorColor={isOverBudget ? "bg-red-500" : "bg-blue-500"} />
                                        <div className="flex justify-between text-[10px] text-muted-foreground dark:text-slate-500">
                                            <span>{isOverBudget ? 'Over Budget' : `${formatCurrency(600 - value)} left`}</span>
                                            <span className={isOverBudget ? "text-red-500" : ""}>{percentage.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Shopping (Animated) */}
                            {(() => {
                                const { value, percentage, isOverBudget } = getCategoryData('Shopping', 2000);
                                return (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground dark:text-slate-300">Shopping</span>
                                            <span className={cn("text-muted-foreground dark:text-slate-400", isOverBudget && "text-red-500 dark:text-red-400 font-bold")}>
                                                {formatCurrency(value)} / {formatCurrency(2000)}
                                            </span>
                                        </div>
                                        <Progress value={percentage} className="h-2 bg-muted dark:bg-slate-800" indicatorColor={isOverBudget ? "bg-red-500" : "bg-orange-500"} />
                                        <div className="flex justify-between text-[10px] text-muted-foreground dark:text-slate-500">
                                            <span>{isOverBudget ? 'Over Budget' : `${formatCurrency(2000 - value)} left`}</span>
                                            <span className={isOverBudget ? "text-red-500" : ""}>{percentage.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Education */}
                            {(() => {
                                const { value, percentage, isOverBudget } = getCategoryData('Education', 1000);
                                return (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground dark:text-slate-300">Education</span>
                                            <span className={cn("text-muted-foreground dark:text-slate-400", isOverBudget && "text-red-500 dark:text-red-400 font-bold")}>
                                                {formatCurrency(value)} / {formatCurrency(1000)}
                                            </span>
                                        </div>
                                        <Progress value={percentage} className="h-2 bg-muted dark:bg-slate-800" indicatorColor={isOverBudget ? "bg-red-500" : "bg-yellow-500"} />
                                        <div className="flex justify-between text-[10px] text-muted-foreground dark:text-slate-500">
                                            <span>{isOverBudget ? 'Over Budget' : `${formatCurrency(1000 - value)} left`}</span>
                                            <span className={isOverBudget ? "text-red-500" : ""}>{percentage.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Travel */}
                            {(() => {
                                const { value, percentage, isOverBudget } = getCategoryData('Travel', 1500);
                                return (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground dark:text-slate-300">Travel</span>
                                            <span className={cn("text-muted-foreground dark:text-slate-400", isOverBudget && "text-red-500 dark:text-red-400 font-bold")}>
                                                {formatCurrency(value)} / {formatCurrency(1500)}
                                            </span>
                                        </div>
                                        <Progress value={percentage} className="h-2 bg-muted dark:bg-slate-800" indicatorColor={isOverBudget ? "bg-red-500" : "bg-indigo-500"} />
                                        <div className="flex justify-between text-[10px] text-muted-foreground dark:text-slate-500">
                                            <span>{isOverBudget ? 'Over Budget' : `${formatCurrency(1500 - value)} left`}</span>
                                            <span className={isOverBudget ? "text-red-500" : ""}>{percentage.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* --- Bottom Row --- */}

                    {/* 3. Spending Donut (Col 6) */}
                    <div className="col-span-5 bg-card dark:bg-slate-900 rounded-xl border border-border/10 dark:border-white/10 p-5 shadow-lg relative min-h-[250px] transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold text-foreground dark:text-white">Spending by Category</h3>
                            <div className="flex items-center text-[10px] text-muted-foreground dark:text-slate-400 gap-1 bg-muted dark:bg-slate-800 px-2 py-0.5 rounded border border-border/5 dark:border-white/5">
                                Dec 2025 <ChevronDown className="w-3 h-3" />
                            </div>
                        </div>

                        <div className="h-[180px] w-full relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={spendingData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={10}
                                        isAnimationActive={false}
                                    >
                                        {spendingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <motion.div
                                    key={expenses}
                                    className="text-lg font-bold text-foreground dark:text-white tabular-nums"
                                >
                                    ₹{(expenses / 1000).toFixed(1)}k
                                </motion.div>
                                <div className="text-[10px] text-muted-foreground dark:text-slate-400">Total</div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex justify-center gap-3 mt-2 flex-wrap">
                            {spendingData.map((item, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-[10px] text-slate-400">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. Trend Bar Chart (Col 6) */}
                    <div className="col-span-7 bg-card dark:bg-slate-900 rounded-xl border border-border/10 dark:border-white/10 p-5 shadow-lg min-h-[250px] flex flex-col transition-colors">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-foreground dark:text-white">6-Month Trend</h3>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground dark:text-slate-400">
                                    <div className="w-2 h-2 rounded-full bg-red-500" /> Expenses
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground dark:text-slate-400">
                                    <div className="w-2 h-2 rounded-full bg-green-500" /> Income
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData} barSize={12}>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₹${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} animationDuration={1000} />
                                    <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
