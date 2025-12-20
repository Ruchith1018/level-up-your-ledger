import { useGamification } from "@/contexts/GamificationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "lucide-react"; // Keeping a placeholder or just removing unused if none left.
// Actually allow me to check if I can just remove the line if all are unused.
// All 6 stats use custom images.
// Let's verify if any other icon is used.
// No other icons used in the file based on the view.
// So I will remove the import line entirely.
import { BADGES } from "@/utils/gamify";

export function GamificationStats() {
    const { state } = useGamification();

    // Calculate task stats
    const dailyTasksCompleted = state.claimedTasks.filter(id => id.includes("daily_")).length;
    const weeklyTasksCompleted = state.claimedTasks.filter(id => id.includes("weekly_")).length;
    const monthlyTasksCompleted = state.claimedTasks.filter(id => id.includes("monthly_")).length;

    // Count only valid badges that exist in BADGES constant
    const allBadgeIds = Object.values(BADGES).map(b => b.id);
    const validBadges = state.badges.filter(badgeId => allBadgeIds.includes(badgeId));

    const stats = [
        {
            label: "Badges Earned",
            value: validBadges.length,
            icon: ({ className }: { className?: string }) => <img src="/assets/badge.png" alt="Badge" className={`object-contain ${className}`} />,
            color: "text-yellow-500"
        },
        {
            label: "Daily Tasks",
            value: dailyTasksCompleted,
            icon: ({ className }: { className?: string }) => <img src="/assets/daily_task.png" alt="Daily Tasks" className={`object-contain ${className}`} />,
            color: "text-blue-500"
        },
        {
            label: "Weekly Tasks",
            value: weeklyTasksCompleted,
            icon: ({ className }: { className?: string }) => <img src="/assets/weekly_task.png" alt="Weekly Tasks" className={`object-contain ${className}`} />,
            color: "text-purple-500"
        },
        {
            label: "Monthly Tasks",
            value: monthlyTasksCompleted,
            icon: ({ className }: { className?: string }) => <img src="/assets/monthly_task.png" alt="Monthly Tasks" className={`object-contain ${className}`} />,
            color: "text-green-500"
        },
        {
            label: "Total XP",
            value: state.totalXP || 0,
            icon: ({ className }: { className?: string }) => <img src="/assets/xp.png" alt="XP" className={`object-contain ${className}`} />,
            color: "text-orange-500"
        },
        {
            label: "Total Tokens Earned",
            value: state.totalCoins || 0,
            icon: ({ className }: { className?: string }) => <img src="/assets/token.png" alt="Token" className={`object-contain ${className}`} />,
            color: "text-amber-500"
        }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>BudGlio Stats</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                            <stat.icon className={`w-6 h-6 mb-2 ${stat.color}`} />
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="text-xs text-muted-foreground text-center">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
