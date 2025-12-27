import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

// --- Data Types & Helpers ---
type DayData = {
    day: number;
    value: number;
    intensity: number; // 0-4 scale
    categoryIndex: number; // 0-4 for spending, 0-2 for earning
};

// Generate deterministic random data for December
const generateMonthData = (seed: number, min: number, max: number, categoryCount: number): DayData[] => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
        // pseudo-random based on day + seed
        const rand = Math.sin(i * seed) * 10000;
        const normalized = Math.abs(rand - Math.floor(rand));
        const value = Math.floor(normalized * (max - min) + min);

        // Intensity 0-4 based on value relative to max
        let intensity = 0;
        if (value > max * 0.8) intensity = 4;
        else if (value > max * 0.6) intensity = 3;
        else if (value > max * 0.4) intensity = 2;
        else if (value > max * 0.2) intensity = 1;

        // Assign a random category index
        const catRand = Math.sin(i * seed * 2) * 10000;
        const categoryIndex = Math.floor(Math.abs(catRand - Math.floor(catRand)) * categoryCount);

        days.push({ day: i, value, intensity, categoryIndex });
    }
    return days;
};

// Colors
const SPENDING_PALETTE = ['#1e293b', '#7c2d12', '#c2410c', '#ea580c', '#f97316'];
const EARNING_PALETTE = ['#1e293b', '#064e3b', '#047857', '#10b981', '#34d399'];

const SPENDING_CAT_NAMES = ['Entertainment', 'Other', 'Travel', 'Education', 'Shopping'];
const EARNING_CAT_NAMES = ['Person (interest)', 'Freelancing', 'Job'];

const DONUT_COLORS_SPENDING = ['#3b82f6', '#60a5fa', '#2563eb', '#facc15', '#f97316'];
const DONUT_COLORS_EARNING = ['#34d399', '#10b981', '#059669'];

export const AnalyticsPreview = ({ className }: { className?: string }) => {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.1 });
    const [currentDay, setCurrentDay] = useState(0);

    // Static Data Generation (with categories now)
    const spendingDays = useMemo(() => generateMonthData(123, 100, 2000, 5), []);
    const earningDays = useMemo(() => generateMonthData(456, 500, 5000, 3), []);

    // Animation Loop
    useEffect(() => {
        if (!isInView) return;

        const interval = setInterval(() => {
            setCurrentDay(prev => {
                if (prev >= 31) return 1; // Loop back
                return prev + 1;
            });
        }, 150); // Fast daily tick

        return () => clearInterval(interval);
    }, [isInView]);

    // Derived Data for Donuts (Cumulative & Categorized)
    const currentSpendingData = spendingDays.slice(0, currentDay);
    const currentEarningData = earningDays.slice(0, currentDay);

    const currentSpendingTotal = currentSpendingData.reduce((acc, curr) => acc + curr.value, 0);
    const currentEarningTotal = currentEarningData.reduce((acc, curr) => acc + curr.value, 0);

    // Dynamic Category Aggregation
    const spendingCategories = SPENDING_CAT_NAMES.map((name, index) => ({
        name,
        // Sum values for transactions matching this category up to current day
        value: currentSpendingData.filter(d => d.categoryIndex === index).reduce((acc, curr) => acc + curr.value, 0),
        color: DONUT_COLORS_SPENDING[index]
    })); // Keep 0 values for stable animation

    const earningCategories = EARNING_CAT_NAMES.map((name, index) => ({
        name,
        value: currentEarningData.filter(d => d.categoryIndex === index).reduce((acc, curr) => acc + curr.value, 0),
        color: DONUT_COLORS_EARNING[index]
    }));

    const formatCurrency = (val: number) => `₹${Math.floor(val)}`;

    return (
        <div ref={containerRef} className={cn("w-full h-full bg-slate-950 flex flex-col font-sans overflow-hidden", className)}>

            {/* --- macOS Header --- */}
            <div className="h-8 bg-slate-900 border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                <div className="flex gap-1.5 group">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex-1 flex justify-center px-2">
                    <div className="h-5 bg-slate-800/50 rounded flex items-center px-3 text-[10px] text-slate-500 w-full max-w-[200px] justify-center font-medium">
                        budglio.in/analytics
                    </div>
                </div>
                <div className="w-[52px]" /> {/* Spacer for balance */}
            </div>

            <div className="flex-1 p-4 grid grid-cols-2 grid-rows-[auto_1fr] gap-4 overflow-auto">

                {/* Quadrant 1: Spending Heatmap */}
                <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-semibold text-white">Spending Heatmap</h3>
                        <div className="flex items-center text-[9px] text-slate-400 gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-white/5">
                            Dec 2025 <ChevronDown className="w-2.5 h-2.5" />
                        </div>
                    </div>
                    <div className="flex-1 grid grid-cols-7 gap-1.5 content-start">
                        {spendingDays.map((d) => (
                            <div
                                key={d.day}
                                className="aspect-square rounded-sm flex items-center justify-center text-xs font-bold transition-colors duration-300"
                                style={{
                                    backgroundColor: d.day <= currentDay ? SPENDING_PALETTE[d.intensity] : '#1e293b',
                                    color: d.day <= currentDay ? 'white' : 'rgba(255,255,255,0.3)'
                                }}
                            >
                                {d.day}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quadrant 2: Earning Heatmap */}
                <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-semibold text-white">Earning Heatmap</h3>
                        <div className="flex items-center text-[9px] text-slate-400 gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-white/5">
                            Dec 2025 <ChevronDown className="w-2.5 h-2.5" />
                        </div>
                    </div>
                    <div className="flex-1 grid grid-cols-7 gap-1.5 content-start">
                        {earningDays.map((d) => (
                            <div
                                key={d.day}
                                className="aspect-square rounded-sm flex items-center justify-center text-xs font-bold transition-colors duration-300"
                                style={{
                                    backgroundColor: d.day <= currentDay ? EARNING_PALETTE[d.intensity] : '#1e293b',
                                    color: d.day <= currentDay ? 'white' : 'rgba(255,255,255,0.3)'
                                }}
                            >
                                {d.day}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quadrant 3: Spending Donut */}
                <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 flex flex-col relative">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-semibold text-white">Spending by Category</h3>
                    </div>
                    <div className="flex-1 min-h-[180px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={spendingCategories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                    isAnimationActive={false}
                                    cornerRadius={4}
                                >
                                    {spendingCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-sm font-bold text-white tabular-nums">{formatCurrency(currentSpendingTotal)}</div>
                            <div className="text-[8px] text-slate-400">Total</div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                        {spendingCategories.map((cat, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="text-[10px] text-slate-400">{cat.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quadrant 4: Earning Donut */}
                <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 flex flex-col relative">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-semibold text-white">Earnings by Category</h3>
                    </div>
                    <div className="flex-1 min-h-[180px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={earningCategories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                    isAnimationActive={false}
                                    cornerRadius={4}
                                >
                                    {earningCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-sm font-bold text-white tabular-nums">{formatCurrency(currentEarningTotal)}</div>
                            <div className="text-[8px] text-slate-400">Total</div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                        {earningCategories.map((cat, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="text-[10px] text-slate-400">{cat.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
