
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, CheckCircle2, Crown, Timer, Users, Swords, Gem, Ticket, Flame, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
    userId: string;
    name: string;
    avatar?: string;
    level: number;
    xp: number;
    totalXP: number;
    tasksCompleted: number;
    badgesCount: number;
    history?: any[];
}

export default function LeaderboardPage() {
    const { user: currentUser } = useAuth();
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(50); // Increased default visible count
    const [activeTab, setActiveTab] = useState("level");
    const [timeFilter, setTimeFilter] = useState("all_time");

    // Mock Timer Logic
    const getTimeRemaining = (filter: string) => {
        const now = new Date();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - now.getDay()), 23, 59, 59); // Next Sunday
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

        let targetDate = endOfDay;
        if (filter === "week") targetDate = endOfWeek;
        if (filter === "month") targetDate = endOfMonth;
        if (filter === "year") targetDate = endOfYear;

        const diff = targetDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (filter === "all_time") return null;

        return { days, hours, minutes };
    };

    const CountdownTimer = ({ filter }: { filter: string }) => {
        const [timeLeft, setTimeLeft] = useState(getTimeRemaining(filter));

        useEffect(() => {
            const timer = setInterval(() => {
                setTimeLeft(getTimeRemaining(filter));
            }, 60000); // Update every minute
            return () => clearInterval(timer);
        }, [filter]);

        if (!timeLeft) return null;

        return (
            <div className="flex items-center gap-2 text-xs font-mono bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
                <Clock className="w-3 h-3" />
                <span>
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                </span>
            </div>
        )
    }

    const fetchData = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const { data: usersData, error: usersError } = await supabase
                .from("user_settings")
                .select("user_id, user_name, profile_image");

            if (usersError) throw usersError;

            const { data: profiles, error: profilesError } = await supabase
                .from("gamification_profiles")
                .select("*");

            if (profilesError) throw profilesError;

            const mergedData: LeaderboardEntry[] = usersData.map(user => {
                const profile = profiles?.find(p => p.user_id === user.user_id);
                return {
                    userId: user.user_id,
                    name: user.user_name || "Anonymous User",
                    avatar: user.profile_image,
                    level: profile?.level || 1,
                    xp: profile?.xp || 0,
                    totalXP: profile?.total_xp || 0,
                    tasksCompleted: profile?.claimed_tasks?.length || 0,
                    badgesCount: profile?.badges?.length || 0,
                    history: profile?.history || []
                };
            });

            setLeaderboardData(mergedData);
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('leaderboard-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'gamification_profiles'
                },
                () => {
                    fetchData(false);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filterDataByTime = (data: LeaderboardEntry[], filter: string) => {
        if (filter === "all_time") return data;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        let startTime = startOfDay;
        if (filter === "week") startTime = startOfWeek;
        if (filter === "month") startTime = startOfMonth;
        if (filter === "year") startTime = startOfYear;

        return data.map(entry => {
            const relevantHistory = entry.history?.filter((h: any) => new Date(h.date) >= startTime) || [];

            // Recalculate based on history
            const filteredXP = relevantHistory.reduce((sum: number, h: any) => sum + (h.xpEarned || 0), 0);
            // Assuming each history entry with XP or Coin gain is a "task" or activity
            const filteredTasks = relevantHistory.length;

            return {
                ...entry,
                totalXP: filteredXP,
                tasksCompleted: filteredTasks
            };
        });
    };

    const getProcessedData = () => {
        // Only apply time filter for Tasks and XP tabs logic, but for simplicity apply to a copy for sorting
        // Note: Badges and Level usually don't have 'monthly' resets in this context unless history tracks them, 
        // but user asked specifically for "Tasks and XP".

        // For Level and Badges, we use All Time always (or ignore filter).
        // For Tasks and XP, we use filter.

        let dataToUse = [...leaderboardData];

        if (activeTab === 'tasks' || activeTab === 'xp') {
            dataToUse = filterDataByTime(dataToUse, timeFilter);
        }

        return dataToUse;
    };

    const getSortedByLevel = () => {
        return [...leaderboardData].sort((a, b) => { // Level is always all-time
            if (b.level !== a.level) return b.level - a.level;
            return b.totalXP - a.totalXP;
        });
    };

    const getSortedByTasks = () => {
        const data = filterDataByTime([...leaderboardData], timeFilter);
        return data.sort((a, b) => b.tasksCompleted - a.tasksCompleted);
    };

    const getSortedByBadges = () => {
        return [...leaderboardData].sort((a, b) => b.badgesCount - a.badgesCount); // Badges usually all-time
    };

    const getSortedByTotalXP = () => {
        const data = filterDataByTime([...leaderboardData], timeFilter);
        return data.sort((a, b) => b.totalXP - a.totalXP);
    };

    // --- Sub-Components ---



    const TopRankCard = ({ entry, rank, type }: { entry: LeaderboardEntry, rank: number, type: 'level' | 'tasks' | 'badges' | 'xp' }) => {
        const isGold = rank === 1;
        const isSilver = rank === 2;
        const isBronze = rank === 3;

        const borderColor = isGold ? "border-yellow-500" : isSilver ? "border-slate-400" : "border-amber-700";
        const badgeColor = isGold ? "bg-yellow-500" : isSilver ? "bg-slate-400" : "bg-amber-700";
        const glowClass = isGold ? "shadow-[0_0_30px_-10px_rgba(234,179,8,0.3)]" : "";



        return (
            <Card className={cn("relative overflow-hidden bg-card/60 backdrop-blur border-2 transition-transform hover:-translate-y-1 duration-300", borderColor, glowClass)}>


                <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-3 mb-6">
                        <div className="relative">
                            <Avatar className={cn("w-20 h-20 border-4", borderColor)}>
                                <AvatarImage src={entry.avatar} alt={entry.name} />
                                <AvatarFallback>{entry.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className={cn("absolute -bottom-2 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm border border-background", badgeColor)}>
                                {rank}
                            </div>
                        </div>
                        <div className="text-center w-full overflow-hidden px-2">
                            <h3 className="font-bold text-lg truncate">{entry.name}</h3>

                        </div>
                    </div>

                    <div className="flex justify-center text-center mb-6">
                        <div>
                            <div className="text-[10px] uppercase text-muted-foreground font-semibold">
                                {type === 'level' ? 'Lvl' : type === 'tasks' ? 'Tasks' : type === 'badges' ? 'Badges' : 'XP'}
                            </div>
                            <div className="font-bold text-lg">
                                {type === 'level' ? entry.level : type === 'tasks' ? entry.tasksCompleted : type === 'badges' ? entry.badgesCount : entry.totalXP.toLocaleString()}
                            </div>
                        </div>
                    </div>


                </CardContent>
            </Card>
        )
    }

    const LeaderboardTable = ({ data, type }: { data: LeaderboardEntry[], type: 'level' | 'tasks' | 'badges' | 'xp' }) => {
        // Skip top 3
        const listData = data.slice(3);

        return (
            <div className="space-y-3 mt-8">
                {listData.map((user, index) => (
                    <div
                        key={user.userId}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border bg-card/40 hover:bg-card/60 transition-colors",
                            user.userId === currentUser?.id && "border-primary/50 bg-primary/5 hover:bg-primary/10"
                        )}
                    >
                        <div className="font-bold text-muted-foreground w-8 text-center">{index + 4}</div>

                        <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{user.name}</div>

                        </div>

                        <div className="text-right font-bold text-lg whitespace-nowrap">
                            {type === 'level' ? `Lvl ${user.level}` : type === 'tasks' ? `${user.tasksCompleted} Tasks` : type === 'badges' ? `${user.badgesCount} Badges` : `${user.totalXP} XP`}
                        </div>
                    </div>
                ))}

                {listData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No more rankings to display.
                    </div>
                )}

                {listData.length > 0 && (visibleCount < listData.length) && (
                    <div className="text-center mt-4">
                        <button className="text-sm text-primary hover:underline" onClick={() => setVisibleCount(prev => prev + 50)}>
                            Load More
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 transition-all duration-200">
                <div className="container mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold">Leaderboard</h1>
                    <p className="text-sm text-muted-foreground">Competing for glory</p>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {isLoading ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Skeleton className="h-32 w-full rounded-xl" />
                            <Skeleton className="h-32 w-full rounded-xl" />
                            <Skeleton className="h-32 w-full rounded-xl" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Skeleton className="h-64 w-full rounded-xl" />
                            <Skeleton className="h-64 w-full rounded-xl" />
                            <Skeleton className="h-64 w-full rounded-xl" />
                        </div>
                        <Skeleton className="h-96 w-full rounded-xl" />
                    </div>
                ) : (
                    <Tabs defaultValue="level" className="w-full space-y-8" onValueChange={setActiveTab}>

                        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
                            <TabsList className="grid w-full md:w-[500px] grid-cols-4">
                                <TabsTrigger value="level">Level</TabsTrigger>
                                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                                <TabsTrigger value="badges">Badges</TabsTrigger>
                                <TabsTrigger value="xp">Total XP</TabsTrigger>
                            </TabsList>

                            {(activeTab === 'tasks' || activeTab === 'xp') && (
                                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <CountdownTimer filter={timeFilter} />
                                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                                        <SelectTrigger className="w-[140px] h-9 text-xs">
                                            <SelectValue placeholder="Period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all_time">All Time</SelectItem>
                                            <SelectItem value="month">This Month</SelectItem>
                                            <SelectItem value="week">This Week</SelectItem>
                                            <SelectItem value="day">Today</SelectItem>
                                            <SelectItem value="year">This Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* Top 3 Section - Conditional based on tab */}
                        <TabsContent value="level" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto">
                                {/* Order: 2, 1, 3 for visual hierarchy if needed, but grid simplifies strict order */}
                                {/* Actually design shows 1st large on left? No, usually 2-1-3. 
                                    The image shows: Rank 1 (Left-ish?), Rank 2 (Center?), Rank 3 (Right?). 
                                    Wait, the image shows Rank 1 Highlighted on the LEFT. Then Rank 2, Rank 3. 
                                    Let's follow standard Left-to-Right 1, 2, 3 but Highlight 1.
                                */}
                                {getSortedByLevel()[0] && <TopRankCard entry={getSortedByLevel()[0]} rank={1} type="level" />}
                                {getSortedByLevel()[1] && <TopRankCard entry={getSortedByLevel()[1]} rank={2} type="level" />}
                                {getSortedByLevel()[2] && <TopRankCard entry={getSortedByLevel()[2]} rank={3} type="level" />}
                            </div>
                            <LeaderboardTable data={getSortedByLevel()} type="level" />
                        </TabsContent>

                        <TabsContent value="tasks" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto">
                                {getSortedByTasks()[0] && <TopRankCard entry={getSortedByTasks()[0]} rank={1} type="tasks" />}
                                {getSortedByTasks()[1] && <TopRankCard entry={getSortedByTasks()[1]} rank={2} type="tasks" />}
                                {getSortedByTasks()[2] && <TopRankCard entry={getSortedByTasks()[2]} rank={3} type="tasks" />}
                            </div>
                            <LeaderboardTable data={getSortedByTasks()} type="tasks" />
                        </TabsContent>

                        <TabsContent value="badges" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto">
                                {getSortedByBadges()[0] && <TopRankCard entry={getSortedByBadges()[0]} rank={1} type="badges" />}
                                {getSortedByBadges()[1] && <TopRankCard entry={getSortedByBadges()[1]} rank={2} type="badges" />}
                                {getSortedByBadges()[2] && <TopRankCard entry={getSortedByBadges()[2]} rank={3} type="badges" />}
                            </div>
                            <LeaderboardTable data={getSortedByBadges()} type="badges" />
                        </TabsContent>

                        <TabsContent value="xp" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto">
                                {getSortedByTotalXP()[0] && <TopRankCard entry={getSortedByTotalXP()[0]} rank={1} type="xp" />}
                                {getSortedByTotalXP()[1] && <TopRankCard entry={getSortedByTotalXP()[1]} rank={2} type="xp" />}
                                {getSortedByTotalXP()[2] && <TopRankCard entry={getSortedByTotalXP()[2]} rank={3} type="xp" />}
                            </div>
                            <LeaderboardTable data={getSortedByTotalXP()} type="xp" />
                        </TabsContent>

                        {/* Hidden Tabs List to maintain logic without breaking UI style if user wants to switch */}

                    </Tabs>
                )}
            </main>
        </div>
    );
}
