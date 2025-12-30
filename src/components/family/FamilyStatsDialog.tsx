
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";
import { Loader2, TrendingUp, TrendingDown, Wallet, AlertCircle } from "lucide-react";

interface FamilyStatsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    familyId: string;
    availableMonths: string[];
    currentMonth: string;
}

export function FamilyStatsDialog({ open, onOpenChange, familyId, availableMonths, currentMonth }: FamilyStatsDialogProps) {
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<{
        limits: Record<string, number>;
        contributions: Record<string, number>;
        spent: Record<string, number>;
        members: any[];
        totalContributed: number;
        totalSpent: number;
        remainingLimit: number;
        currency: string;
    } | null>(null);

    useEffect(() => {
        if (open) {
            fetchMonthStats(selectedMonth);
        }
    }, [open, selectedMonth]);

    const fetchMonthStats = async (month: string) => {
        setLoading(true);
        try {
            // 1. Get Budget ID for this month
            const { data: budget } = await supabase
                .from('family_budgets')
                .select('id, total_amount')
                .eq('family_id', familyId)
                .eq('month', month)
                .maybeSingle();

            if (!budget) {
                setStats(null);
                setLoading(false);
                return;
            }

            // 2. Fetch Limits
            const { data: limitsData } = await supabase
                .from('family_budget_limits')
                .select('user_id, limit_amount')
                .eq('family_budget_id', budget.id);

            const limitsMap: Record<string, number> = {};
            (limitsData || []).forEach((l: any) => limitsMap[l.user_id] = Number(l.limit_amount));

            // 3. Fetch Contributions
            const { data: contributions } = await supabase
                .from('family_budget_contributions')
                .select('user_id, amount')
                .eq('family_budget_id', budget.id);

            const contributionsMap: Record<string, number> = {};
            let totalContributed = 0;
            (contributions || []).forEach((c: any) => {
                contributionsMap[c.user_id] = (contributionsMap[c.user_id] || 0) + Number(c.amount);
                totalContributed += Number(c.amount);
            });

            // 4. Fetch Expenses
            const { data: expenses } = await supabase
                .from('expenses')
                .select('user_id, amount')
                .eq('family_budget_id', budget.id);

            const spentMap: Record<string, number> = {};
            let totalSpent = 0;
            (expenses || []).forEach((e: any) => {
                spentMap[e.user_id] = (spentMap[e.user_id] || 0) + Number(e.amount);
                totalSpent += Number(e.amount);
            });

            // 5. Fetch Member Profiles (for names)
            // We get user IDs from limits, contributions, or spending to ensure we catch everyone
            const allUserIds = new Set([
                ...Object.keys(limitsMap),
                ...Object.keys(contributionsMap),
                ...Object.keys(spentMap)
            ]);

            let members: any[] = [];
            if (allUserIds.size > 0) {
                const { data: profiles } = await supabase
                    .from('user_settings')
                    .select('user_id, user_name, profile_image')
                    .in('user_id', Array.from(allUserIds));
                members = profiles || [];
            }

            setStats({
                limits: limitsMap,
                contributions: contributionsMap,
                spent: spentMap,
                members,
                totalContributed,
                totalSpent,
                remainingLimit: totalContributed - totalSpent,
                currency: '₹' // Hardcoded for now based on app context
            });

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-primary" />
                            Monthly Budget Stats
                        </DialogTitle>
                        {availableMonths.length > 0 && (
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[180px] h-8">
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMonths.map((m) => (
                                        <SelectItem key={m} value={m}>
                                            {dayjs(m + '-01').format('MMMM YYYY')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <DialogDescription>
                        Detailed breakdown of family spending and limits for {dayjs(selectedMonth + '-01').format('MMMM YYYY')}.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : stats ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900">
                                    <p className="text-xs text-muted-foreground uppercase font-medium">Total Raised</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.currency}{stats.totalContributed}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900">
                                    <p className="text-xs text-muted-foreground uppercase font-medium">Total Spent</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">{stats.currency}{stats.totalSpent}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                                    <p className="text-xs text-muted-foreground uppercase font-medium">Remaining</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.currency}{stats.remainingLimit}</p>
                                </div>
                            </div>

                            {/* Detailed Table */}
                            <div className="border rounded-md flex-1 relative overflow-hidden flex flex-col">
                                <ScrollArea className="flex-1">
                                    <Table>
                                        <TableHeader className="bg-secondary/50 sticky top-0 z-10">
                                            <TableRow>
                                                <TableHead>Member</TableHead>
                                                <TableHead className="text-right">Assigned Limit</TableHead>
                                                <TableHead className="text-right">Contributed</TableHead>
                                                <TableHead className="text-right">Spent</TableHead>
                                                <TableHead className="text-right">Remaining</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stats.members.map((member) => {
                                                const limit = stats.limits[member.user_id] || 0;
                                                const contributed = stats.contributions[member.user_id] || 0;
                                                const spent = stats.spent[member.user_id] || 0;
                                                const remaining = Math.max(0, limit - spent);
                                                const isOverLimit = spent > limit && limit > 0;

                                                return (
                                                    <TableRow key={member.user_id}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                                                    {member.profile_image ? (
                                                                        <img src={member.profile_image} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                                                                            {member.user_name?.[0] || 'U'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {member.user_name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-xs">
                                                            {stats.currency}{limit}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-xs text-green-600">
                                                            +{stats.currency}{contributed}
                                                        </TableCell>
                                                        <TableCell className={`text-right font-mono text-xs ${isOverLimit ? 'text-red-500 font-bold' : ''}`}>
                                                            {stats.currency}{spent}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-xs">
                                                            <Badge variant="outline" className={remaining < limit * 0.2 ? "text-red-500 border-red-200" : ""}>
                                                                {stats.currency}{remaining}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {stats.members.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                        No activity found for this month.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
                            <AlertCircle className="w-8 h-8 opacity-20" />
                            <p>No budget data found for this month.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
