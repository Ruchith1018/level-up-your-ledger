import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useExpenses } from "@/contexts/ExpenseContext";
import { useBudget } from "@/contexts/BudgetContext";
import dayjs from "dayjs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
    Activity,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    MapPin,
    Trophy,
    TrendingUp,
    Wallet,
    Star,
    Award,
    Target,
    Zap,
    Camera,
    Upload,
    Loader2,
    Mail,
    Users
} from "lucide-react";
import { GamificationStats } from "@/components/gamification/GamificationStats";
import { BADGES } from "@/utils/gamify";

const ProfilePage = () => {
    const { user } = useAuth();
    const { state, refreshGamification } = useGamification();
    const { settings, updateSettings, isLoading: settingsLoading } = useSettings();
    const { state: expenseState, getTotalByType } = useExpenses();
    const { state: budgetState, getBudgetByMonth } = useBudget();
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const profileInputRef = useRef<HTMLInputElement>(null);
    const longestStreak = 14;
    // State for banner and profile images
    const [bannerImage, setBannerImage] = useState<string | null>(settings.bannerImage || null);
    const [profileImage, setProfileImage] = useState<string | null>(settings.profileImage || null);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingProfile, setUploadingProfile] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'stats' | 'analysis' | 'account'>('stats');
    const [expandedSection, setExpandedSection] = useState<'streak' | 'achievements' | 'activity' | null>('streak');

    // Update local state when settings change
    useEffect(() => {
        if (settings.bannerImage) setBannerImage(settings.bannerImage);
        if (settings.profileImage) setProfileImage(settings.profileImage);
    }, [settings.bannerImage, settings.profileImage]);

    // Handle tab visibility - refresh data when user returns to tab
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (!document.hidden) {
                // Tab became visible - refresh data
                setIsRefreshing(true);
                try {
                    await refreshGamification();
                    // Small delay to show the loading animation
                    setTimeout(() => setIsRefreshing(false), 800);
                } catch (error) {
                    console.error('Error refreshing profile data:', error);
                    setIsRefreshing(false);
                }
            }
        };

        // Initial load when component mounts
        const initialLoad = async () => {
            setIsRefreshing(true);
            try {
                await refreshGamification();
                setTimeout(() => setIsRefreshing(false), 800);
            } catch (error) {
                console.error('Error loading profile data:', error);
                setIsRefreshing(false);
            }
        };

        // Call initial load
        initialLoad();

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []); // Empty dependency array to run only on mount/unmount

    // Family Stats State
    // Family Stats State
    const [familyStats, setFamilyStats] = useState<{
        hasFamily: boolean;
        month: string;
        totalBudget: number;
        totalSpent: number;
        isLoading: boolean;
        familyImage?: string;
        familyName?: string;
        contributions: Array<{
            userId: string;
            name: string;
            amount: number;
            percentage: number;
            color: string;
        }>;
    }>({
        hasFamily: false,
        month: '',
        totalBudget: 0,
        totalSpent: 0,
        isLoading: true,
        contributions: []
    });

    // Fetch Family Stats
    useEffect(() => {
        const fetchFamilyStats = async () => {
            if (!user) return;
            try {
                // 1. Check family membership
                const { data: memberData } = await supabase
                    .from('family_members')
                    .select('family_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!memberData) {
                    setFamilyStats(prev => ({ ...prev, hasFamily: false, isLoading: false }));
                    return;
                }

                // 1b. Fetch Family Details
                const { data: familyData } = await supabase
                    .from('families')
                    .select('name, profile_image')
                    .eq('id', memberData.family_id)
                    .single();

                // 2. Get current month's budget
                const today = new Date();
                const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

                const { data: budgetData } = await supabase
                    .from('family_budgets')
                    .select('id, total_amount')
                    .eq('family_id', memberData.family_id)
                    .eq('month', currentMonth)
                    .maybeSingle();

                let totalSpent = 0;
                let totalBudget = 0;
                let contributionsList: any[] = [];

                if (budgetData) {
                    // 3. Get expenses for this budget
                    const { data: expenses } = await supabase
                        .from('expenses')
                        .select('amount, user_id')
                        .eq('family_budget_id', budgetData.id);

                    if (expenses && expenses.length > 0) {
                        totalSpent = expenses.reduce((sum, ex) => sum + Number(ex.amount), 0);
                        totalBudget = Number(budgetData.total_amount);

                        // 4. Calculate Contributions
                        const userSpending: Record<string, number> = {};
                        const userIds = new Set<string>();

                        expenses.forEach(ex => {
                            const uid = ex.user_id || 'unknown';
                            userSpending[uid] = (userSpending[uid] || 0) + Number(ex.amount);
                            if (ex.user_id) userIds.add(ex.user_id);
                        });

                        // 5. Fetch Member Names
                        let userProfiles: any[] = [];
                        if (userIds.size > 0) {
                            const { data: profiles } = await supabase
                                .from('user_settings')
                                .select('user_id, user_name')
                                .in('user_id', Array.from(userIds));
                            userProfiles = profiles || [];
                        }

                        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];

                        contributionsList = Object.entries(userSpending)
                            .map(([uid, amount], index) => {
                                const profile = userProfiles.find(p => p.user_id === uid);
                                const isCurrentUser = uid === user.id;
                                const name = isCurrentUser ? 'You' : (profile?.user_name || 'Member');
                                return {
                                    userId: uid,
                                    name,
                                    amount,
                                    percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
                                    color: colors[index % colors.length]
                                };
                            })
                            .sort((a, b) => b.amount - a.amount);
                    }
                }

                setFamilyStats({
                    hasFamily: true,
                    month: currentMonth,
                    totalBudget: totalBudget,
                    totalSpent: totalSpent,
                    isLoading: false,
                    familyImage: familyData?.profile_image,
                    familyName: familyData?.name,
                    contributions: contributionsList
                });

            } catch (error) {
                console.error("Error fetching family stats:", error);
                setFamilyStats(prev => ({ ...prev, isLoading: false }));
            }
        };

        fetchFamilyStats();
    }, [user]);

    // Get user's name from settings first, then email or metadata
    const getUserName = () => {
        // First priority: userName from settings
        if (settings.userName) {
            return settings.userName;
        }
        // Second priority: full_name from user metadata
        if (user?.user_metadata?.full_name) {
            return user.user_metadata.full_name;
        }
        // Third priority: format email username
        if (user?.email) {
            const emailName = user.email.split('@')[0];
            return emailName
                .replace(/[._]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }
        return "User";
    };

    // Get user's initials for avatar fallback
    const getUserInitials = (email: string) => {
        return email.substring(0, 2).toUpperCase();
    };

    // Handle banner upload to Supabase
    const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user?.id) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Banner image must be less than 5MB");
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        setUploadingBanner(true);
        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/banner-${Date.now()}.${fileExt}`;

            // Upload to Supabase storage (banner bucket)
            const { data, error } = await supabase.storage
                .from('banner')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('banner')
                .getPublicUrl(fileName);

            // Update settings with banner URL
            await updateSettings({ bannerImage: publicUrl });
            setBannerImage(publicUrl);
            toast.success("Banner uploaded successfully!");
        } catch (error) {
            console.error('Error uploading banner:', error);
            toast.error("Failed to upload banner");
        } finally {
            setUploadingBanner(false);
        }
    };

    // Handle profile picture upload to Supabase
    const handleProfileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user?.id) return;

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Profile image must be less than 2MB");
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        setUploadingProfile(true);
        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;

            // Upload to Supabase storage (avatars bucket - assuming it exists)
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Update settings with profile image URL
            await updateSettings({ profileImage: publicUrl });
            setProfileImage(publicUrl);
            toast.success("Profile picture uploaded successfully!");
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            toast.error("Failed to upload profile picture");
        } finally {
            setUploadingProfile(false);
        }
    };

    // Calculate financial health metrics (these would be real in production)
    const financialMetrics = [
        { name: "Budget Planning", value: 85 },
        { name: "Savings Goal", value: 72 },
        { name: "Expense Control", value: 90 },
        { name: "Consistency", value: 78 },
    ];

    // Gamification stats for circular progress
    const gamificationStats = [
        {
            label: "Level",
            value: state.level,
            max: state.level + 1,
            percentage: Math.min(100, (state.xp / ((state.level + 1) * 100)) * 100),
            color: "text-secondary"
        },
        {
            label: "Streak",
            value: state.streak,
            max: 30,
            percentage: Math.min(100, (state.streak / 30) * 100),
            color: "text-warning"
        },
        {
            label: "Badges",
            value: state.badges.length,
            max: 20,
            percentage: Math.min(100, (state.badges.length / 20) * 100),
            color: "text-gold"
        },
        {
            label: "Tasks",
            value: state.claimedTasks.length,
            max: 50,
            percentage: Math.min(100, (state.claimedTasks.length / 50) * 100),
            color: "text-accent"
        },
    ];
    // Recent achievements/badges
    const recentBadges = state.badges.slice(-4).reverse();

    // Recent activity (last few history items)
    const recentActivity = state.history.slice(-4).reverse();

    // Show loading state while settings or gamification data is loading

    if (settingsLoading || !state || isRefreshing) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <img
                        src="/assets/token.png"
                        alt="Loading..."
                        className="w-24 h-24 animate-spin"
                        style={{ animationDuration: '2s' }}
                    />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section with Gradient/Custom Background */}
                <Card className="relative overflow-hidden border-none">
                    {/* Banner Image or Gradient */}
                    {bannerImage ? (
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${bannerImage})` }}
                        >
                            <div className="absolute inset-0 bg-black/30" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-accent to-primary opacity-90" />
                    )}

                    {/* Banner Upload Button */}
                    <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white border-white/30"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={uploadingBanner}
                    >
                        {uploadingBanner ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Banner
                            </>
                        )}
                    </Button>
                    <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBannerUpload}
                    />

                    <div className="relative p-8 md:p-12">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            {/* Profile Picture */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl" />
                                <Avatar className="h-32 w-32 border-4 border-white/50 relative">
                                    <AvatarImage
                                        src={settings.profileImage || profileImage || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ""}
                                    />
                                    <AvatarFallback className="text-3xl font-bold bg-white/20 text-white">
                                        {user?.email ? getUserInitials(user.email) : "U"}
                                    </AvatarFallback>
                                </Avatar>
                                {/* Profile Picture Upload Overlay */}
                                <button
                                    onClick={() => !uploadingProfile && profileInputRef.current?.click()}
                                    disabled={uploadingProfile}
                                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                                >
                                    {uploadingProfile ? (
                                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                                    ) : (
                                        <Camera className="h-8 w-8 text-white" />
                                    )}
                                </button>
                                <input
                                    ref={profileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleProfileUpload}
                                />
                            </div>

                            {/* User Info */}
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                                        {getUserName()}
                                    </h1>
                                    <p className="text-xl text-white/80 mt-1">Level {state.level}</p>
                                </div>

                                {/* Contact Info */}
                                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-white/90">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        <span className="text-sm">{user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-sm">{user?.user_metadata?.location || "Global"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-4 w-4" />
                                        <span className="text-sm">{state.totalXP.toLocaleString()} Total XP</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Tabs Navigation */}
                <div className="border-b border-border bg-card rounded-lg">
                    <div className="flex gap-6 px-4">
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`flex items-center gap-2 py-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'stats'
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >

                            Details
                            {activeTab === 'stats' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`flex items-center gap-2 py-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'analysis'
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <TrendingUp className="h-4 w-4" />
                            Analysis
                            {activeTab === 'analysis' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`flex items-center gap-2 py-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'account'
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Star className="h-4 w-4" />
                            Account
                            {activeTab === 'account' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'stats' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Streak Tracker (appears last on mobile, first on desktop) */}
                        <div className="space-y-6 order-2 lg:order-2">

                            {/* Performance Stats */}
                            {expenseState.items && budgetState.budgets && (
                                <Card className="p-4 md:p-6 bg-card">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Performance
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-4">
                                        {(() => {
                                            const today = dayjs();
                                            const currentMonth = today.format('YYYY-MM');
                                            const lastMonth = today.subtract(1, 'month').format('YYYY-MM');
                                            const currencySymbol = settings.currency === 'INR' ? '₹' : settings.currency;

                                            // 1. Budget Adherence with precise Rollover Logic (matching BudgetOverview)
                                            const currentBudget = budgetState.budgets.find((b: any) => b.month === currentMonth);
                                            const previousBudget = getBudgetByMonth(lastMonth);

                                            // Calculate Rollover
                                            let rolloverAmount = 0;
                                            if (previousBudget && (previousBudget.surplusAction === 'rollover' || previousBudget.rollover)) {
                                                const previousExpenses = getTotalByType("expense", lastMonth);
                                                rolloverAmount = Math.max(0, previousBudget.total - previousExpenses);
                                            }

                                            const baseBudget = currentBudget ? currentBudget.total : 0;
                                            const totalBudget = baseBudget + rolloverAmount;

                                            const currentMonthExpenses = getTotalByType("expense", currentMonth);
                                            const budgetUsedPercentage = totalBudget > 0 ? (currentMonthExpenses / totalBudget) * 100 : 0;
                                            const budgetColor = budgetUsedPercentage < 80 ? 'text-green-500' : budgetUsedPercentage <= 100 ? 'text-yellow-500' : 'text-red-500';

                                            // 2. Savings Rate
                                            const currentMonthIncome = getTotalByType("income", currentMonth);
                                            const savings = currentMonthIncome - currentMonthExpenses;
                                            const savingsRate = currentMonthIncome > 0 ? (savings / currentMonthIncome) * 100 : 0;

                                            const lastMonthIncome = getTotalByType("income", lastMonth);
                                            const lastMonthExpenses = getTotalByType("expense", lastMonth);
                                            const lastMonthSavings = lastMonthIncome - lastMonthExpenses;
                                            const lastMonthSavingsRate = lastMonthIncome > 0 ? (lastMonthSavings / lastMonthIncome) * 100 : 0;
                                            const savingsTrend = savingsRate >= lastMonthSavingsRate ? 'up' : 'down';

                                            // 3. Burn Rate
                                            const daysSoFar = today.date();
                                            const burnRate = daysSoFar > 0 ? currentMonthExpenses / daysSoFar : 0;
                                            const daysInMonth = today.daysInMonth();

                                            let burnInsight = "On track";
                                            if (totalBudget > 0 && burnRate > 0) {
                                                const projectedSpend = burnRate * daysInMonth;
                                                if (projectedSpend > totalBudget) {
                                                    const budgetRemaining = totalBudget - currentMonthExpenses;
                                                    if (budgetRemaining <= 0) {
                                                        burnInsight = "Budget exhausted";
                                                    } else {
                                                        const daysToExhaust = Math.floor(budgetRemaining / burnRate);
                                                        burnInsight = `Ends in ~${daysToExhaust} days at this Rate`;
                                                    }
                                                } else {
                                                    burnInsight = "Within budget";
                                                }
                                            } else if (totalBudget === 0) {
                                                burnInsight = "No budget set";
                                            }

                                            // 4. Expense Growth
                                            const expenseGrowth = lastMonthExpenses > 0 ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
                                            const roundedGrowth = Math.round(expenseGrowth);

                                            // 5. Income vs Expense Ratio
                                            const incomeSpentPercentage = currentMonthIncome > 0 ? (currentMonthExpenses / currentMonthIncome) * 100 : 0;

                                            // 6. Budget Consistency Score (Last 6 Months)
                                            let monthsOnTrack = 0;
                                            let monthsWithBudget = 0;
                                            for (let i = 0; i < 6; i++) {
                                                const m = today.subtract(i, 'month').format('YYYY-MM');
                                                const mBudget = budgetState.budgets.find((b: any) => b.month === m);

                                                if (mBudget && mBudget.total > 0) {
                                                    monthsWithBudget++;

                                                    // Calculate rollover from previous month (m-1)
                                                    const prevM = today.subtract(i + 1, 'month').format('YYYY-MM');
                                                    const prevMBudget = budgetState.budgets.find((b: any) => b.month === prevM);
                                                    let rolloverForM = 0;

                                                    if (prevMBudget && (prevMBudget.surplusAction === 'rollover' || prevMBudget.rollover)) {
                                                        const prevMExpenses = getTotalByType("expense", prevM);
                                                        rolloverForM = Math.max(0, prevMBudget.total - prevMExpenses);
                                                    }

                                                    const totalBudgetForM = mBudget.total + rolloverForM;
                                                    const mExpenses = getTotalByType("expense", m);

                                                    if (mExpenses <= totalBudgetForM) {
                                                        monthsOnTrack++;
                                                    }
                                                }
                                            }
                                            const consistencyScore = monthsWithBudget > 0 ? Math.round((monthsOnTrack / monthsWithBudget) * 100) : 0;

                                            return (
                                                <>
                                                    {/* Budget Adherence */}
                                                    <div className="flex flex-col p-3 bg-secondary/10 rounded-lg" title={rolloverAmount > 0 ? `Base: ${currencySymbol}${Math.round(baseBudget).toLocaleString()} + Rollover: ${currencySymbol}${Math.round(rolloverAmount).toLocaleString()}` : undefined}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs text-muted-foreground">Budget Used</span>
                                                        </div>
                                                        <div className="flex items-baseline gap-1.5 flex-wrap">
                                                            <span className={`text-xs sm:text-sm md:text-lg lg:text-xl font-bold tracking-tight ${budgetColor}`}>{Math.round(budgetUsedPercentage)}%</span>
                                                            <span className="text-xs text-muted-foreground whitespace-nowrap hidden min-[500px]:inline">of {currencySymbol} {Math.round(totalBudget).toLocaleString()}</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-secondary/30 rounded-full mt-2 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${budgetUsedPercentage < 80 ? 'bg-green-500' : budgetUsedPercentage <= 100 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                                style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Savings Rate */}
                                                    <div className="flex flex-col p-3 bg-secondary/10 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs text-muted-foreground">Savings Rate</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold tracking-tight text-foreground">{Math.round(savingsRate)}%</span>
                                                            {savingsTrend === 'up' ?
                                                                <ArrowUpRight className="w-4 h-4 text-green-500" /> :
                                                                <ArrowDownRight className="w-4 h-4 text-red-500" />
                                                            }
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1 hidden min-[500px]:block">vs {Math.round(lastMonthSavingsRate)}% last month</p>
                                                    </div>

                                                    {/* Burn Rate */}
                                                    <div className="flex flex-col p-3 bg-secondary/10 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs text-muted-foreground">Burn Rate</span>
                                                        </div>
                                                        <div className="flex items-baseline gap-1 flex-wrap">
                                                            <span className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold tracking-tight text-foreground whitespace-nowrap">{currencySymbol} {Math.round(burnRate).toLocaleString()}</span>
                                                            <span className="text-[10px] sm:text-xs font-normal text-muted-foreground hidden min-[500px]:inline">/day</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1 truncate hidden min-[500px]:block" title={burnInsight}>{burnInsight}</p>
                                                    </div>

                                                    {/* Expense Growth */}
                                                    <div className="flex flex-col p-3 bg-secondary/10 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs text-muted-foreground">Exp. Growth</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-xs sm:text-sm md:text-lg lg:text-xl font-bold tracking-tight ${expenseGrowth > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                {expenseGrowth > 0 ? '+' : ''}{roundedGrowth}%
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1 hidden min-[500px]:block">MoM Change</p>
                                                    </div>

                                                    {/* Income vs Expense Ratio */}
                                                    <div className="flex flex-col p-3 bg-secondary/10 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs text-muted-foreground">Income vs Exp.</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <span className={`text-xs sm:text-sm md:text-lg lg:text-xl font-bold tracking-tight ${incomeSpentPercentage > 100 ? 'text-red-500' : 'text-foreground'}`}>
                                                                {Math.round(incomeSpentPercentage)}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-secondary/30 rounded-full mb-1 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${incomeSpentPercentage > 100 ? 'bg-red-500' : incomeSpentPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                style={{ width: `${Math.min(incomeSpentPercentage, 100)}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground hidden min-[500px]:block">You spent {Math.round(incomeSpentPercentage)}% of earned</p>
                                                    </div>

                                                    {/* Budget Consistency Score */}
                                                    <div className="flex flex-col p-3 bg-secondary/10 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs text-muted-foreground">Budget Score</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold tracking-tight text-foreground">{consistencyScore}/100</span>
                                                        </div>
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 text-ellipsis overflow-hidden whitespace-nowrap hidden min-[500px]:block">{monthsOnTrack} / {monthsWithBudget} months on track</p>
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 min-[500px]:hidden">{monthsOnTrack}/{monthsWithBudget} on track</p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </Card>
                            )}
                            <Card className="p-4 md:p-6 bg-card">
                                <div className="space-y-4 md:space-y-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-3 md:mb-4">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Streak Tracker
                                            </p>
                                            <button
                                                onClick={() => setExpandedSection(expandedSection === 'streak' ? null : 'streak')}
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                                aria-label={expandedSection === 'streak' ? "Collapse" : "Expand"}
                                            >
                                                {expandedSection === 'streak' ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>

                                        {/* Fully Expandable Content */}
                                        <div className={`overflow-hidden transition-all duration-300 ${expandedSection === 'streak' ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            {/* Current Streak */}
                                            <div className="text-center py-4 md:py-6 border-b border-border">
                                                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 mb-2 md:mb-3">
                                                    <img src="/assets/streak.png" alt="Streak" className="w-3/5 h-3/5 object-contain" />
                                                </div>
                                                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-1">{state.streak}</h3>
                                                <p className="text-sm text-muted-foreground">Day Streak</p>
                                            </div>


                                            {/* Longest Streak */}
                                            <div className="flex items-center justify-between py-3 md:py-4 border-b border-border">
                                                <p className="text-sm text-muted-foreground">Longest Streak</p>
                                                <p className="text-lg md:text-xl font-bold text-foreground">{Math.max(state.streak, state.longestStreak || state.streak)} days</p>
                                            </div>

                                            {/* Calendar Heatmap */}
                                            <div className="pt-3 md:pt-4">
                                                <p className="text-xs text-muted-foreground mb-2 md:mb-3">Last 28 Days Activity</p>
                                                <div className="grid grid-cols-7 gap-1 md:gap-1.5">
                                                    {Array.from({ length: 28 }).map((_, index) => {
                                                        const daysAgo = 27 - index;
                                                        const isActive = daysAgo < state.streak;
                                                        const today = new Date();
                                                        const currentDate = new Date(today);
                                                        currentDate.setDate(today.getDate() - daysAgo);

                                                        return (
                                                            <div
                                                                key={index}
                                                                className={`w-full aspect-square rounded-sm transition-colors ${isActive
                                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                                    : 'bg-secondary/20'
                                                                    }`}
                                                                title={`${currentDate.toLocaleDateString()}: ${isActive ? 'Active' : 'Inactive'}`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                <div className="flex justify-between items-center mt-2 md:mt-3">
                                                    <span className="text-xs text-muted-foreground">Less</span>
                                                    <div className="flex gap-1">
                                                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-secondary/20" />
                                                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-green-300" />
                                                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-green-500" />
                                                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-emerald-600" />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">More</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Recent Achievements/Badges */}
                            <Card className="p-4 md:p-6 bg-card">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Recent Badges
                                        </p>
                                        <button
                                            onClick={() => setExpandedSection(expandedSection === 'achievements' ? null : 'achievements')}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label={expandedSection === 'achievements' ? "Collapse" : "Expand"}
                                        >
                                            {expandedSection === 'achievements' ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>

                                    <div className={`overflow-hidden transition-all duration-300 ${expandedSection === 'achievements' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        {/* Badge Progress Summary */}
                                        <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg mb-4">
                                            <span className="text-sm text-muted-foreground">Total Badges</span>
                                            <span className="text-lg font-bold text-foreground">{state.badges.length}</span>
                                        </div>

                                        {/* Recent Badges List */}
                                        <div className="space-y-3">
                                            {state.badges.slice(0, 3).map((badgeId, index) => {
                                                const badge = Object.values(BADGES).find(b => b.id === badgeId);
                                                const badgeName = badge?.name || badgeId;
                                                return (
                                                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors">
                                                        <div className="w-10 h-10 flex-shrink-0">
                                                            <img
                                                                src="/assets/badge.png"
                                                                alt="Badge"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-foreground truncate">{badgeName}</p>
                                                            <p className="text-xs text-muted-foreground">Unlocked recently</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {state.badges.length === 0 && (
                                                <div className="text-center py-6 text-muted-foreground">
                                                    <img
                                                        src="/assets/badge.png"
                                                        alt="No Badges"
                                                        className="w-12 h-12 mx-auto mb-2 opacity-50 grayscale"
                                                    />
                                                    <p className="text-sm">No badges earned yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Activity Timeline */}
                            <Card className="p-4 md:p-6 bg-card">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Recent Activity
                                        </p>
                                        <button
                                            onClick={() => setExpandedSection(expandedSection === 'activity' ? null : 'activity')}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label={expandedSection === 'activity' ? "Collapse" : "Expand"}
                                        >
                                            {expandedSection === 'activity' ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>

                                    <div className={`overflow-hidden transition-all duration-300 ${expandedSection === 'activity' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="space-y-3">
                                            {state.history.slice(0, 3).map((activity, index) => {
                                                const xpAmount = activity.xpEarned || 0;
                                                const coinsAmount = activity.coinsEarned || activity.coinsSpent || 0;
                                                const isPositive = (activity.xpEarned && activity.xpEarned > 0) || (activity.coinsEarned && activity.coinsEarned > 0);

                                                return (
                                                    <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                                                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${isPositive ? 'bg-success' : 'bg-muted-foreground'}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-foreground">{activity.reason}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-xs text-muted-foreground">
                                                                    {new Date(activity.date).toLocaleDateString()}
                                                                </p>
                                                                {xpAmount > 0 && (
                                                                    <span className="text-xs font-medium text-success">+{xpAmount} XP</span>
                                                                )}
                                                                {coinsAmount > 0 && (
                                                                    <span className="text-xs font-medium text-warning">{coinsAmount} Tokens</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {state.history.length === 0 && (
                                                <div className="text-center py-6 text-muted-foreground">
                                                    <Zap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No recent activity</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Right Column - Level Progress & BudGlio Stats (appears first on mobile, last on desktop) */}
                        <div className="lg:col-span-2 space-y-6 order-1 lg:order-1">
                            {/* Level Progress Bar */}
                            <Card className="p-6 bg-card">
                                <div className="space-y-6">
                                    {/* Header with Level Badge */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                                                Current Level
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-2">
                                                        <img src="/assets/level.png" alt="Level" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent border-2 border-card flex items-center justify-center">
                                                        <span className="text-xs font-bold text-white">{state.level}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold text-foreground mb-1">Level {state.level}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {state.level < 10 ? 'Beginner' : state.level < 25 ? 'Intermediate' : state.level < 50 ? 'Advanced' : 'Expert'} Budgeter
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground mb-1">Total XP</p>
                                            <p className="text-3xl font-bold text-foreground">{state.totalXP.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Progress Section */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-sm font-medium text-foreground">
                                                Progress to Level {state.level + 1}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {state.xp} / {(state.level + 1) * 100} XP
                                            </span>
                                        </div>

                                        <div className="relative h-3 bg-secondary/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all duration-500 ease-out"
                                                style={{
                                                    width: `${Math.min(100, (state.xp / ((state.level + 1) * 100)) * 100)}%`
                                                }}
                                            />
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">
                                                {Math.min(100, Math.round((state.xp / ((state.level + 1) * 100)) * 100))}% Complete
                                            </span>
                                            <span className="text-muted-foreground">
                                                {((state.level + 1) * 100) - state.xp} XP to next level
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border">
                                        <div className="text-center space-y-1">
                                            <p className="text-xs text-muted-foreground">Current XP</p>
                                            <p className="text-2xl font-bold text-foreground">{state.xp}</p>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-xs text-muted-foreground">Next Level</p>
                                            <p className="text-2xl font-bold text-foreground">{(state.level + 1) * 100}</p>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-xs text-muted-foreground">Remaining</p>
                                            <p className="text-2xl font-bold text-foreground">{((state.level + 1) * 100) - state.xp}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* BudGlio Stats */}
                            <GamificationStats />

                            {/* Family Stats (Current Month) */}
                            {familyStats.hasFamily && (
                                <Card className="p-4 md:p-6 bg-card">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            {familyStats.familyImage ? (
                                                <Avatar className="w-10 h-10 border-2 border-primary/20">
                                                    <AvatarImage src={familyStats.familyImage} alt={familyStats.familyName} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        <Users className="w-5 h-5" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="p-2 bg-primary/10 rounded-full">
                                                    <Users className="w-4 h-4 text-primary" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-foreground">{familyStats.familyName || "Family Stats"}</h3>
                                                <p className="text-xs text-muted-foreground">Current Month</p>
                                            </div>
                                        </div>
                                        {familyStats.totalBudget > 0 && (
                                            <Badge variant={((familyStats.totalSpent / familyStats.totalBudget) * 100) > 100 ? "destructive" : "secondary"}>
                                                {Math.round((familyStats.totalSpent / familyStats.totalBudget) * 100)}% Used
                                            </Badge>
                                        )}
                                    </div>

                                    {familyStats.isLoading ? (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : familyStats.totalBudget === 0 ? (
                                        <div className="text-center p-4 bg-muted/30 rounded-lg border border-dashed border-border">
                                            <p className="text-sm text-muted-foreground">No family budget set for this month</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Progress Bar */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Budget Usage</span>
                                                    <span className="font-medium">
                                                        {settings.currency === 'INR' ? '₹' : settings.currency} {Math.round(familyStats.totalSpent).toLocaleString()} / {Math.round(familyStats.totalBudget).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="h-2.5 bg-secondary/30 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${(familyStats.totalSpent / familyStats.totalBudget) > 1 ? 'bg-red-500' :
                                                            (familyStats.totalSpent / familyStats.totalBudget) > 0.8 ? 'bg-yellow-500' :
                                                                'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min(100, (familyStats.totalSpent / familyStats.totalBudget) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Metrics Grid */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-secondary/10 rounded-lg">
                                                    <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                                                    <p className={`text-lg font-bold ${familyStats.totalBudget - familyStats.totalSpent < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                        {settings.currency === 'INR' ? '₹' : settings.currency} {Math.max(0, Math.round(familyStats.totalBudget - familyStats.totalSpent)).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-secondary/10 rounded-lg">
                                                    <p className="text-xs text-muted-foreground mb-1">Daily Average</p>
                                                    <p className="text-lg font-bold text-foreground">
                                                        {settings.currency === 'INR' ? '₹' : settings.currency} {Math.round(familyStats.totalSpent / Math.max(1, new Date().getDate())).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Contributions Breakdown */}
                                            {familyStats.contributions.length > 0 && (
                                                <div className="space-y-3 pt-2 border-t border-border">
                                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expense Contributions</h4>
                                                    <div className="space-y-2">
                                                        {familyStats.contributions.map((member) => (
                                                            <div key={member.userId} className="space-y-1">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className={member.name === 'You' ? 'font-semibold text-primary' : ''}>
                                                                        {member.name} <span className="text-muted-foreground">({Math.round(member.percentage)}%)</span>
                                                                    </span>
                                                                    <span>{settings.currency === 'INR' ? '₹' : settings.currency} {Math.round(member.amount).toLocaleString()}</span>
                                                                </div>
                                                                <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${member.color}`}
                                                                        style={{ width: `${member.percentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Financial Metrics */}
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
                                    Financial Health
                                </h2>
                                <div className="space-y-5">
                                    {financialMetrics.map((metric) => (
                                        <div key={metric.name} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-foreground">{metric.name}</span>
                                                <span className="text-muted-foreground">{metric.value}%</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                                                    style={{ width: `${metric.value}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>



                        {/* Right Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Financial Overview */}
                            <Card className="p-6">
                                <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
                                    Financial Overview
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                                        <div className="flex items-center gap-3">
                                            <Star className="h-8 w-8 text-primary" />
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">{state.totalXP.toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">Total XP</p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
                                        <div className="flex items-center gap-3">
                                            <Wallet className="h-8 w-8 text-gold" />
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">{state.coins.toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">Coins</p>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                                        <div className="flex items-center gap-3">
                                            <Target className="h-8 w-8 text-accent" />
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">{state.streak}</p>
                                                <p className="text-xs text-muted-foreground">Day Streak</p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </Card>

                            {/* Detailed Analysis */}
                            <Card className="p-6">
                                <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
                                    Performance Analysis
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-foreground">Achievement Progress</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {gamificationStats.map((stat) => (
                                                <div key={stat.label} className="p-4 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className={`h-2 w-2 rounded-full ${stat.color.replace('text-', 'bg-')}`} />
                                                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                                                    </div>
                                                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                                                    <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${stat.color.replace('text-', 'bg-')}`}
                                                            style={{ width: `${stat.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-foreground">Recent Performance</h3>
                                        <div className="space-y-3">
                                            {recentActivity.slice(0, 3).map((item, index) => {
                                                const xpAmount = item.xpEarned || 0;
                                                const isPositive = item.xpEarned && item.xpEarned > 0;
                                                return (
                                                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-sm font-medium truncate flex-1">{item.reason}</p>
                                                            <Badge variant={isPositive ? "default" : "secondary"} className="ml-2">
                                                                {xpAmount > 0 ? `+${xpAmount}` : '0'} XP
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(item.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'account' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Account Info */}
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
                                    Account Information
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Email</p>
                                            <p className="text-sm font-medium">{user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <MapPin className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Location</p>
                                            <p className="text-sm font-medium">{user?.user_metadata?.location || "Global"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <Star className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Username</p>
                                            <p className="text-sm font-medium">{getUserName()}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Account Settings */}
                            <Card className="p-6">
                                <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
                                    Profile Settings
                                </h2>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-foreground mb-3">Upload Images</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 border rounded-lg">
                                                <p className="text-sm font-medium mb-2">Profile Picture</p>
                                                <p className="text-xs text-muted-foreground mb-3">Max size: 2MB</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => profileInputRef.current?.click()}
                                                    disabled={uploadingProfile}
                                                    className="w-full"
                                                >
                                                    {uploadingProfile ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Camera className="h-4 w-4 mr-2" />
                                                            Change Profile Picture
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                            <div className="p-4 border rounded-lg">
                                                <p className="text-sm font-medium mb-2">Banner Image</p>
                                                <p className="text-xs text-muted-foreground mb-3">Max size: 5MB</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => bannerInputRef.current?.click()}
                                                    disabled={uploadingBanner}
                                                    className="w-full"
                                                >
                                                    {uploadingBanner ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-4 w-4 mr-2" />
                                                            Change Banner
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-foreground mb-3">Account Details</h3>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <p className="text-xs text-muted-foreground mb-1">Display Name</p>
                                                <p className="text-sm font-medium">{getUserName()}</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                                                <p className="text-sm font-medium">{user?.email}</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <p className="text-xs text-muted-foreground mb-1">Account Level</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge>Level {state.level}</Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {state.totalXP.toLocaleString()} Total XP
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Recent Activity for Account Tab */}
                            <Card className="p-6">
                                <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider">
                                    Recent Activity
                                </h2>
                                <div className="space-y-3">
                                    {recentActivity.length > 0 ? (
                                        recentActivity.map((item, index) => {
                                            const xpAmount = item.xpEarned || 0;
                                            const coinsAmount = item.coinsEarned || item.coinsSpent || 0;
                                            const isPositive = (item.xpEarned && item.xpEarned > 0) || (item.coinsEarned && item.coinsEarned > 0);
                                            const Icon = isPositive ? TrendingUp : Wallet;

                                            return (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                                >
                                                    <div className={`p-2 rounded-lg ${isPositive ? 'bg-success/20' : 'bg-muted'}`}>
                                                        <Icon className={`h-5 w-5 ${isPositive ? 'text-success' : 'text-muted-foreground'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {item.reason}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(item.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Badge variant={isPositive ? "default" : "secondary"} className="shrink-0">
                                                        {xpAmount > 0 ? `+${xpAmount} XP` : coinsAmount > 0 ? `${coinsAmount} coins` : '-'}
                                                    </Badge>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No recent activity. Start tracking your finances!</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
