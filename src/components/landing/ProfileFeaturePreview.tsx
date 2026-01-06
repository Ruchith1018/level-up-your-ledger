
import React, { useEffect, useState, useRef } from 'react';
import { useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronRight, ChevronDown, CheckCircle2, TrendingUp, ArrowUpRight, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileFeaturePreviewProps {
    className?: string;
}

// Reusable CountUp Component
const CountUp = ({ to, duration = 1.5, className, prefix = '', suffix = '' }: { to: number, duration?: number, className?: string, prefix?: string, suffix?: string }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, Math.round);
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const controls = animate(count, to, {
            duration,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: 5
        });
        return controls.stop;
    }, [to, duration]);

    useEffect(() => {
        rounded.on("change", v => setDisplayValue(v));
    }, [rounded]);

    return <span className={className}>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

// Reusable Circular Progress for Analysis
const AnalysisCircularScore = ({ score, max = 100, label, subtext, color, delay }: { score: number, max?: number, label: string, subtext: string, color: string, delay: number }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / max) * circumference;

    return (
        <div
            className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-sm dark:shadow-none transition-colors duration-300"
        >
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-900/5 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative w-24 h-24 mb-4">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-gray-800/50 transition-colors duration-300" />
                    <circle
                        cx="48" cy="48" r={radius}
                        stroke="currentColor" strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={color}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-2xl font-bold", color)}>
                        <CountUp to={score} duration={1.5} />
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-gray-500 uppercase">/ {max}</span>
                </div>
            </div>

            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{label}</h4>
            <p className="text-[10px] text-slate-500 dark:text-gray-500 leading-tight px-1">{subtext}</p>
        </div>
    );
};

export const ProfileFeaturePreview: React.FC<ProfileFeaturePreviewProps> = ({ className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [containerHeight, setContainerHeight] = useState<number | 'auto'>('auto');
    const [activeTab, setActiveTab] = useState('Details');

    // Handle Auto-Scaling for Mobile
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && contentRef.current && window.innerWidth < 1024) { // Only scale on mobile/tablet
                const containerWidth = containerRef.current.offsetWidth;
                const baseWidth = 1200; // Base width for Profile Preview
                const newScale = Math.min(containerWidth / baseWidth, 1);
                setScale(newScale);

                // Calculate dynamic height
                const contentHeight = contentRef.current.offsetHeight || 600;
                setContainerHeight(contentHeight * newScale);
            } else {
                setScale(1);
                setContainerHeight('auto');
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeTab]); // Re-calculate on tab change

    return (
        <div
            ref={containerRef}
            className={cn("w-full bg-slate-50 dark:bg-[#0a0e17] flex flex-col overflow-hidden font-sans select-none text-slate-900 dark:text-slate-200 group relative transition-colors duration-300", className)}
            style={{
                height: containerHeight === 'auto' ? '100%' : `${containerHeight}px`,
            }}
        >
            <div
                ref={contentRef}
                className="lg:w-full lg:h-full flex flex-col origin-top-left"
                style={{
                    width: window.innerWidth < 1024 ? '1200px' : '100%',
                    transform: window.innerWidth < 1024 ? `scale(${scale})` : 'none',
                    height: window.innerWidth < 1024 ? 'auto' : '100%'
                }}
            >

                {/* MacOS Window Header */}
                <div className="h-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 flex items-center px-4 gap-2 shrink-0 transition-colors duration-300">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                    <div className="flex-1 flex justify-center px-2">
                        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded flex items-center px-2 opacity-50 w-full max-w-sm justify-center border border-slate-200 dark:border-border/5">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">budglio.in/profile</div>
                        </div>
                    </div>
                </div>

                {/* 1. Header & Banner */}
                <div
                    className="relative shrink-0 bg-slate-50 dark:bg-[#0a0e17] transition-colors duration-300"
                >
                    <div className="mx-6 mt-6 h-48 rounded-xl relative overflow-hidden bg-slate-900 dark:bg-slate-950 group shadow-sm dark:shadow-none">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-[#0f1623] dark:bg-[#0f1623]" />
                        <div className="absolute top-0 right-0 h-full w-2/3 pointer-events-none">
                            <div className="absolute right-0 top-0 h-full w-full bg-gradient-to-l from-emerald-600/80 to-transparent" style={{ clipPath: 'path("M100 0 L0 0 Q60 100 100 200 Z")' }} />
                            {/* Abstract Shape Overlay */}
                            <div className="absolute right-[-40px] top-[-60px] w-80 h-80 rounded-full border-[35px] border-emerald-500/20 blur-sm" />
                            <div className="absolute right-[80px] bottom-[-40px] w-56 h-56 rounded-full border-[25px] border-emerald-400/30 blur-sm" />
                        </div>

                        {/* Upload Button */}
                        <div className="absolute top-4 right-4 bg-white/40 dark:bg-white/20 hover:bg-white/50 dark:hover:bg-white/30 backdrop-blur-md border border-white/40 dark:border-white/20 transition-colors text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer font-medium z-20 shadow-sm">
                            <span className="text-[10px]">↑</span> Upload Banner
                        </div>

                        {/* Profile Info (Inside Banner) */}
                        <div className="absolute bottom-0 left-0 w-full p-6 flex items-center gap-5 z-10">
                            {/* Avatar */}
                            <div
                                className="w-24 h-24 rounded-full bg-white p-1 ring-0 shadow-lg dark:shadow-xl shrink-0 overflow-hidden relative"
                            >
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                                    <img src="/logo.jpg" alt="Profile" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            {/* Text Info */}
                            <div className="flex flex-col justify-center pt-2">
                                <h3 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Adam</h3>
                                <p className="text-white/90 text-sm font-medium mb-1 drop-shadow-sm">Level 1</p>

                                <div className="flex items-center gap-4 text-xs text-white/90 font-medium mt-1 drop-shadow-sm">
                                    <span className="flex items-center gap-1.5"><span className="opacity-70">✉</span> bl.ruchith@gmail.com</span>
                                    <span className="flex items-center gap-1.5"><span className="opacity-70">📍</span> Global</span>
                                    <span className="flex items-center gap-1.5"><span className="opacity-70">🏆</span> 54 Total XP</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 mt-4 border-b border-slate-200 dark:border-gray-800 flex gap-8 text-sm transition-colors duration-300">
                        {['Details', 'Analysis', 'Account', 'Affiliate Program'].map((tab, i) => (
                            <div
                                key={i}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "pb-3 border-b-2 cursor-pointer text-sm font-medium transition-colors relative flex items-center gap-2",
                                    activeTab === tab ? "border-emerald-500 text-slate-900 dark:text-white" : "border-transparent text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300"
                                )}
                            >
                                {tab === 'Details' && activeTab === tab && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-0.5" />}
                                {tab === 'Analysis' && <TrendingUp className="w-3.5 h-3.5 mb-0.5" />}
                                {tab === 'Account' && <div className="w-3.5 h-3.5 mb-0.5 border border-current rounded-full flex items-center justify-center text-[8px]">★</div>}
                                {tab}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Scrollable Content Area */}
                <div className="flex-1 overflow-auto relative p-4 custom-scrollbar bg-slate-50 dark:bg-[#0a0e17] transition-colors duration-300">


                    {activeTab === 'Details' && (
                        <div
                            key="details"
                            className="grid grid-cols-12 gap-4 pb-10"
                        >
                            {/* LEFT COLUMN */}
                            <div className="col-span-8 flex flex-col gap-6">
                                {/* Level Card */}
                                <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-lg p-6 relative overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 relative">
                                                <img src="/assets/level.png" alt="Level" className="w-full h-full object-contain" />
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-white dark:border-[#0f1623]">1</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-wider font-bold mb-0.5">CURRENT LEVEL</div>
                                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Level 1</h4>
                                                <p className="text-xs text-slate-500 dark:text-gray-400">Beginner Budgeter</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-wider font-bold mb-0.5">Total XP</div>
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white"><CountUp to={54} /></div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 mb-2">
                                        <div className="flex justify-between text-[10px] font-semibold">
                                            <span className="text-slate-900 dark:text-white">Progress to Level 2</span>
                                            <span className="text-slate-500 dark:text-gray-400">54 / 200 XP</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1e293b] rounded-full overflow-hidden">
                                            <div
                                                style={{ width: "27%" }}
                                                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-gray-800">
                                        <StatItem label="Current XP" value="54" />
                                        <StatItem label="Next Level" value="200" border />
                                        <StatItem label="Remaining" value="146" border />
                                    </div>
                                </div>

                                {/* BudGlio Stats - RESTORED FULL GRID */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">BudGlio Stats</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <MiniStat icon="/assets/badge.png" value={9} label="Badges" color="text-blue-400" />
                                        <MiniStat icon="/assets/daily_task.png" value={0} label="Daily Tasks" color="text-blue-400" />
                                        <MiniStat icon="/assets/weekly_task.png" value={0} label="Weekly Tasks" color="text-blue-400" />

                                        <MiniStat icon="/assets/monthly_task.png" value={0} label="Monthly Tasks" color="text-blue-400" />
                                        <MiniStat icon="/assets/xp.png" value={54} label="Total XP" color="text-blue-400" />
                                        <MiniStat icon="/assets/token.png" value={10010} label="Tokens" color="text-emerald-400" />
                                    </div>
                                </div>

                                {/* RESTORED TEST CARD */}
                                <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-lg p-4 flex flex-col gap-4 shadow-sm dark:shadow-none transition-colors duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1a2332] flex items-center justify-center text-green-500">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">TEST</div>
                                            <div className="text-xs text-slate-500 dark:text-gray-500">Current Month</div>
                                        </div>
                                    </div>
                                    <div className="w-full py-4 text-center text-xs text-slate-500 dark:text-gray-500 border-t border-dashed border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-[#141b29] rounded transition-colors duration-300">
                                        No family budget set for this month
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="col-span-4 flex flex-col gap-4">
                                {/* Performance - RESTORED FULL METRICS */}
                                <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-lg p-4 shadow-sm dark:shadow-none transition-colors duration-300">
                                    <div className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-4">Performance</div>
                                    <div className="space-y-4">
                                        {/* Budget Used */}
                                        <div className="bg-slate-50 dark:bg-[#151e2f] p-3 rounded-lg border border-slate-200 dark:border-gray-800/50 transition-colors duration-300">
                                            <div className="text-[10px] text-slate-500 dark:text-gray-400 mb-1">Budget Used</div>
                                            <div className="flex items-baseline gap-1 mb-1">
                                                <span className="text-lg font-bold text-green-500"><CountUp to={24} suffix="%" /></span>
                                                <span className="text-[10px] text-slate-500 dark:text-gray-500">of ₹ 720,880</span>
                                            </div>
                                            <div className="h-1 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div style={{ width: "24%" }} className="h-full bg-green-500" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 dark:bg-[#151e2f] p-2 rounded-lg border border-slate-200 dark:border-gray-800/50 transition-colors duration-300">
                                                <div className="text-[9px] text-slate-500 dark:text-gray-400">Savings Rate</div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">72% <span className="text-green-500 text-[9px]">↗</span></div>
                                                <div className="text-[8px] text-slate-500 dark:text-gray-500">vs 0% last mo</div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-[#151e2f] p-2 rounded-lg border border-slate-200 dark:border-gray-800/50 transition-colors duration-300">
                                                <div className="text-[9px] text-slate-500 dark:text-gray-400">Exp. Growth</div>
                                                <div className="text-sm font-bold text-green-500">0%</div>
                                                <div className="text-[8px] text-slate-500 dark:text-gray-500">MoM Change</div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-[#151e2f] p-2 rounded-lg border border-slate-200 dark:border-gray-800/50 transition-colors duration-300">
                                            <div className="text-[9px] text-slate-500 dark:text-gray-400 mb-0.5">Burn Rate</div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">₹34,242<span className="text-[9px] text-slate-500 dark:text-gray-500">/day</span></div>
                                            <div className="text-[8px] text-slate-500 dark:text-gray-500">Ends in ~16 days</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 dark:bg-[#151e2f] p-2 rounded-lg border border-slate-200 dark:border-gray-800/50 transition-colors duration-300">
                                                <div className="text-[9px] text-slate-500 dark:text-gray-400">Income vs Exp</div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">28%</div>
                                                <div className="h-1 bg-slate-200 dark:bg-gray-800 rounded-full mt-1 mb-0.5">
                                                    <div style={{ width: "28%" }} className="h-full bg-blue-600" />
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-[#151e2f] p-2 rounded-lg border border-slate-200 dark:border-gray-800/50 transition-colors duration-300">
                                                <div className="text-[9px] text-slate-500 dark:text-gray-400">Budget Score</div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">100<span className="text-[9px] text-slate-500 dark:text-gray-500 font-normal">/100</span></div>
                                                <div className="text-[8px] text-slate-500 dark:text-gray-500">On Track</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RESTORED STREAK TRACKER */}
                                <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm dark:shadow-none">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Streak Tracker</span>
                                    <ChevronDown className="w-4 h-4 text-slate-500 dark:text-gray-500" />
                                </div>

                                {/* Badges */}
                                <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
                                    <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-[#131b29] flex justify-between transition-colors duration-300">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">Recent Badges</span>
                                        <ChevronDown className="w-4 h-4 text-slate-500 dark:text-gray-500 rotate-180" />
                                    </div>
                                    <div className="p-2">
                                        <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-[#1e293b] rounded mb-2 mx-1 transition-colors duration-300">
                                            <span className="text-xs text-slate-600 dark:text-gray-300">Total Badges</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white"><CountUp to={9} /></span>
                                        </div>
                                        <BadgeRow name="First Steps" />
                                        <BadgeRow name="Budget Ninja" />
                                        <BadgeRow name="No Spend Week" />
                                    </div>
                                </div>

                                {/* RESTORED RECENT ACTIVITY */}
                                <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm dark:shadow-none">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Recent Activity</span>
                                    <ChevronDown className="w-4 h-4 text-slate-500 dark:text-gray-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- ANALYSIS TAB --- */}
                    {activeTab === 'Analysis' && (
                        <div
                            key="analysis"
                            className="space-y-6 pb-10"
                        >
                            <div className="grid grid-cols-3 gap-4">
                                <AnalysisCircularScore
                                    score={100} label="Financial Health" subtext="Your financial health is Excellent."
                                    color="text-green-500" delay={0.1}
                                />
                                <AnalysisCircularScore
                                    score={40} label="Spending Discipline" subtext="Weekend spending often impacts your score."
                                    color="text-orange-500" delay={0.2}
                                />
                                <AnalysisCircularScore
                                    score={50} label="Savings Consistency" subtext="Try to save regularly every month."
                                    color="text-pink-500" delay={0.3}
                                />
                            </div>

                            <div className="grid grid-cols-12 gap-6">
                                <div
                                    className="col-span-8 space-y-4"
                                >
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Financial Performance</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-lg p-4 relative overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
                                            <div className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase mb-2">SAVINGS RATE</div>
                                            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                                                <CountUp to={72} suffix="%" />
                                            </div>
                                            <div className="h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                                                <div
                                                    style={{ width: "72%" }}
                                                    className="h-full bg-green-500"
                                                />
                                            </div>
                                            <div className="text-[10px] text-slate-500 dark:text-gray-400">Excellent (20%+)</div>
                                        </div>

                                        <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-lg p-4 shadow-sm dark:shadow-none transition-colors duration-300">
                                            <div className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase mb-2">EXPENSE GROWTH</div>
                                            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-3">0%</div>
                                            <div className="text-[10px] text-slate-500 dark:text-gray-400">Decreased from last month</div>
                                        </div>

                                        <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-lg p-4 shadow-sm dark:shadow-none transition-colors duration-300">
                                            <div className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase mb-2">BURN RATE</div>
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                                                ₹<CountUp to={34242} /> <span className="text-sm font-normal text-slate-500 dark:text-gray-500">/day</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 dark:text-gray-400">Budget exceeded!</div>
                                        </div>

                                        <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-lg p-4 shadow-sm dark:shadow-none transition-colors duration-300">
                                            <div className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase mb-2">EXP/INCOME RATIO</div>
                                            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-3"><CountUp to={28} suffix="%" /></div>
                                            <div className="h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                                                <div
                                                    style={{ width: "28%" }}
                                                    className="h-full bg-blue-500"
                                                />
                                            </div>
                                            <div className="text-[10px] text-slate-500 dark:text-gray-400">Healthy (&lt;70%)</div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="col-span-4"
                                >
                                    <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-lg p-5 h-full shadow-sm dark:shadow-none transition-colors duration-300">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-5">Analysis Insights</h4>
                                        <div className="space-y-6">
                                            <InsightItem
                                                num={1}
                                                text="Financial Health is Excellent! You are balancing income, savings, and expenses perfectly."
                                                highlight="Excellent" color="text-green-500 bg-green-500/10"
                                            />
                                            <InsightItem
                                                num={2}
                                                text="Impressive! You are saving 72% of your income. This exceeds the recommended 20%."
                                                highlight="72% of your income" color="text-green-500 bg-green-500/10"
                                            />
                                            <InsightItem
                                                num={3}
                                                text="Your spending is stable and consistent with last month."
                                                color="text-green-500 bg-green-500/10"
                                            />
                                            <InsightItem
                                                num={4}
                                                text="Budget Exceeded: You are over your budget by ₹-549671. Stop spending immediately if possible."
                                                highlight="Budget Exceeded" color="text-red-500 bg-red-500/10"
                                                textColor="text-red-500 dark:text-red-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- ACCOUNT TAB --- */}
                    {activeTab === 'Account' && (
                        <div
                            key="account"
                            className="flex flex-col items-center justify-center h-full py-12 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 flex items-center justify-center mb-4 shadow-sm dark:shadow-none transition-colors duration-300">
                                <span className="text-2xl">🔒</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Login to see this feature</h3>
                            <p className="text-sm text-slate-500 dark:text-gray-400 max-w-xs mx-auto">
                                Manage your account settings, preferences, and subscription details here.
                            </p>
                        </div>
                    )}

                    {/* --- AFFILIATE TAB --- */}
                    {activeTab === 'Affiliate Program' && (
                        <div
                            key="affiliate"
                            className="flex flex-col items-center justify-center h-full py-12 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 flex items-center justify-center mb-4 shadow-sm dark:shadow-none transition-colors duration-300">
                                <span className="text-2xl">💸</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Login to see this feature</h3>
                            <p className="text-sm text-slate-500 dark:text-gray-400 max-w-xs mx-auto">
                                Join our affiliate program to earn rewards by inviting friends and family.
                            </p>
                        </div>
                    )}


                </div>

            </div>
        </div >
    );
};

const StatItem = ({ label, value, border = false }: { label: string, value: string, border?: boolean }) => (
    <div className={cn("text-center", border && "border-l border-slate-100 dark:border-gray-800")}>
        <div className="text-[10px] text-slate-500 dark:text-gray-500 mb-1">{label}</div>
        <div className="text-lg font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
);

const MiniStat = ({ icon, value, label, color }: { icon: string, value: number, label: string, color: string }) => (
    <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-gray-800 rounded-lg p-3 flex flex-col items-center justify-center text-center gap-1 shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="w-6 h-6 mb-1">
            <img src={icon} alt={label} className="w-full h-full object-contain" />
        </div>
        <div className="text-base font-bold text-slate-900 dark:text-white"><CountUp to={value} /></div>
        <div className="text-[9px] text-slate-500 dark:text-gray-500">{label}</div>
    </div>
);

const BadgeRow = ({ name }: { name: string }) => (
    <div className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer mb-1">
        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 border border-emerald-500/10">
            <img src="/assets/badge.png" className="w-4 h-4 opacity-80" />
        </div>
        <div className="text-[10px] font-bold text-slate-700 dark:text-white">{name}</div>
    </div>
);

const InsightItem = ({ num, text, highlight, color, textColor = "text-slate-500 dark:text-gray-400" }: { num: number, text: string, highlight?: string, color: string, textColor?: string }) => {
    const parts = highlight ? text.split(highlight) : [text];

    return (
        <div className="flex gap-3">
            <div className={cn("w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5", color)}>
                {num}
            </div>
            <p className={cn("text-xs leading-relaxed", textColor)}>
                {highlight ? (
                    <>
                        {parts[0]}
                        <span className={color.split(' ')[0]}>{highlight}</span>
                        {parts[1]}
                    </>
                ) : text}
            </p>
        </div>
    );
};
