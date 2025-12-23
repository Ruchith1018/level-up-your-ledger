import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, CheckCircle2, Crown, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardEntry {
    userId: string;
    name: string;
    avatar?: string;
    level: number;
    xp: number;
    totalXP: number;
    tasksCompleted: number;
    badgesCount: number;
}

export default function LeaderboardPage() {
    const { user: currentUser } = useAuth();
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Infinite Scroll State
    const [visibleCount, setVisibleCount] = useState(100);

    const loadMore = () => {
        setVisibleCount(prev => prev + 100);
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch ALL user settings (base source of truth for users)
                // Note: RLS policies must allow reading user_name/profile_image for this to work
                const { data: usersData, error: usersError } = await supabase
                    .from("user_settings")
                    .select("user_id, user_name, profile_image");

                if (usersError) throw usersError;

                // 2. Fetch all gamification profiles
                const { data: profiles, error: profilesError } = await supabase
                    .from("gamification_profiles")
                    .select("*");

                if (profilesError) throw profilesError;

                // 3. Map and Join Data (Users -> Profiles)
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
                        badgesCount: profile?.badges?.length || 0
                    };
                });

                setLeaderboardData(mergedData);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getSortedByLevel = () => {
        return [...leaderboardData].sort((a, b) => {
            if (b.level !== a.level) return b.level - a.level;
            return b.totalXP - a.totalXP;
        });
    };

    const getSortedByTasks = () => {
        return [...leaderboardData].sort((a, b) => b.tasksCompleted - a.tasksCompleted);
    };

    const TopThree = ({ data, type }: { data: LeaderboardEntry[], type: 'level' | 'tasks' }) => {
        if (data.length === 0) return null;

        const [first, second, third] = data;

        return (
            <div className="flex justify-center items-end gap-4 mb-8 min-h-[220px]">
                {/* Second Place */}
                {second && (
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-5 duration-500 delay-100">
                        <div className="relative mb-2">
                            <Avatar className="w-16 h-16 border-4 border-slate-300">
                                <AvatarImage src={second.avatar} />
                                <AvatarFallback>{second.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                #2
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <p className="font-semibold text-sm w-24 truncate">{second.name}</p>
                            <p className="text-xs text-muted-foreground font-medium">
                                {type === 'level' ? `Lvl ${second.level}` : `${second.tasksCompleted} Tasks`}
                            </p>
                        </div>
                        <div className="h-24 w-20 bg-gradient-to-t from-slate-200/50 to-slate-200/10 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                            <Medal className="w-8 h-8 text-slate-300" />
                        </div>
                    </div>
                )}

                {/* First Place */}
                {first && (
                    <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom-5 duration-500">
                        <div className="relative mb-2">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
                                <Crown className="w-8 h-8 fill-yellow-500" />
                            </div>
                            <Avatar className="w-24 h-24 border-4 border-yellow-400 shadow-xl shadow-yellow-400/20">
                                <AvatarImage src={first.avatar} />
                                <AvatarFallback className="text-xl">{first.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-0.5 rounded-full shadow-sm">
                                #1
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <p className="font-bold text-base w-32 truncate">{first.name}</p>
                            <p className="text-sm text-yellow-600 font-bold">
                                {type === 'level' ? `Level ${first.level}` : `${first.tasksCompleted} Tasks`}
                            </p>
                        </div>
                        <div className="h-32 w-24 bg-gradient-to-t from-yellow-400/30 to-yellow-400/5 rounded-t-lg mt-2 flex items-end justify-center pb-4">
                            <Trophy className="w-10 h-10 text-yellow-500" />
                        </div>
                    </div>
                )}

                {/* Third Place */}
                {third && (
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-5 duration-500 delay-200">
                        <div className="relative mb-2">
                            <Avatar className="w-16 h-16 border-4 border-amber-600">
                                <AvatarImage src={third.avatar} />
                                <AvatarFallback>{third.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                #3
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <p className="font-semibold text-sm w-24 truncate">{third.name}</p>
                            <p className="text-xs text-muted-foreground font-medium">
                                {type === 'level' ? `Lvl ${third.level}` : `${third.tasksCompleted} Tasks`}
                            </p>
                        </div>
                        <div className="h-20 w-20 bg-gradient-to-t from-amber-600/30 to-amber-600/5 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                            <Medal className="w-8 h-8 text-amber-600" />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const LeaderboardList = ({ data, type }: { data: LeaderboardEntry[], type: 'level' | 'tasks' }) => {
        // Only show rank 4 onwards in list
        const listData = data.slice(3);

        return (
            <div className="space-y-2">
                {listData.map((user, index) => {
                    const isCurrentUser = user.userId === currentUser?.id;
                    return (
                        <div
                            key={user.userId}
                            className={cn(
                                "flex items-center gap-4 p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors",
                                isCurrentUser && "border-primary/50 bg-primary/5 hover:bg-primary/10"
                            )}
                        >
                            <span className="font-bold text-muted-foreground w-6 text-center">{index + 4}</span>
                            <Avatar className="w-10 h-10 border border-border">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className={cn("font-medium text-sm flex items-center gap-2", isCurrentUser && "text-primary")}>
                                    {user.name}
                                    {isCurrentUser && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">YOU</span>}
                                </p>
                                {type === 'level' ? (
                                    <p className="text-xs text-muted-foreground">Total XP: {user.totalXP}</p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Badges: {user.badgesCount}</p>
                                )}

                            </div>
                            <div className="text-right">
                                {type === 'level' ? (
                                    <div className="font-bold text-lg">Lvl {user.level}</div>
                                ) : (
                                    <div className="font-bold text-lg">{user.tasksCompleted}</div>
                                )}
                            </div>
                        </div>
                    )
                })}
                {listData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No more users to show.
                    </div>
                )}
            </div>
        );
    };

    const UserRankFooter = ({ data, type }: { data: LeaderboardEntry[], type: 'level' | 'tasks' }) => {
        if (!currentUser) return null;

        const rankIndex = data.findIndex(u => u.userId === currentUser.id);
        if (rankIndex === -1) return null;

        const userEntry = data[rankIndex];
        const rank = rankIndex + 1;

        return (
            <div className="fixed bottom-[70px] left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-80 bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-10 z-40">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center min-w-[3rem]">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Rank</span>
                        <span className="text-2xl font-bold text-primary">#{rank}</span>
                    </div>

                    <div className="h-10 w-px bg-border"></div>

                    <div className="flex flex-col flex-1">
                        <span className="font-semibold truncate">You</span>
                        <span className="text-xs text-muted-foreground">
                            {type === 'level' ? `${userEntry.totalXP} XP` : `${userEntry.badgesCount} Badges`}
                        </span>
                    </div>

                    <div className="text-right">
                        <span className="block font-bold text-lg">
                            {type === 'level' ? `Lvl ${userEntry.level}` : userEntry.tasksCompleted}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                            {type === 'level' ? 'Level' : 'Tasks'}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                Leaderboard
                            </h1>
                            <p className="text-sm text-muted-foreground">See who's topping the charts!</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-4xl">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                            <img
                                src="/assets/token.png"
                                alt="Loading..."
                                className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
                            />
                        </div>
                        <p className="text-muted-foreground animate-pulse font-medium">Loading rankings...</p>
                    </div>
                ) : (
                    <Tabs defaultValue="level" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="level" className="flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                Overall Level
                            </TabsTrigger>
                            <TabsTrigger value="tasks" className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Tasks Completed
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="level" className="space-y-6">
                            <TopThree data={getSortedByLevel()} type="level" />
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-medium">Rankings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <LeaderboardList data={getSortedByLevel().slice(0, visibleCount)} type="level" />
                                    {getSortedByLevel().length > visibleCount && (
                                        <div className="mt-4 text-center">
                                            <button
                                                onClick={loadMore}
                                                className="text-sm text-primary hover:underline"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <UserRankFooter data={getSortedByLevel()} type="level" />
                        </TabsContent>

                        <TabsContent value="tasks" className="space-y-6">
                            <TopThree data={getSortedByTasks()} type="tasks" />
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-medium">Rankings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <LeaderboardList data={getSortedByTasks().slice(0, visibleCount)} type="tasks" />
                                    {getSortedByTasks().length > visibleCount && (
                                        <div className="mt-4 text-center">
                                            <button
                                                onClick={loadMore}
                                                className="text-sm text-primary hover:underline"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <UserRankFooter data={getSortedByTasks()} type="tasks" />
                        </TabsContent>
                    </Tabs>
                )}
            </main>
        </div>
    );
}
