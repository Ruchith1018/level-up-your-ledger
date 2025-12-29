import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import dayjs from "dayjs";

export interface FamilyBudgetData {
    id: string;
    family_id: string;
    total_amount: number;
    total_contributed: number;
    total_spent: number;
    status: 'collecting' | 'spending' | 'closed';
    month: string;
    spending_limits?: Record<string, number>;
    spent_by_user?: Record<string, number>;
    remaining_budget: number;
    user_remaining_limit?: number;
    user_limit?: number;
}

export function useFamilyBudget() {
    const { user } = useAuth();
    const [familyBudget, setFamilyBudget] = useState<FamilyBudgetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFamilyBudget = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const currentMonth = dayjs().format('YYYY-MM');

            // 1. Get User's Family
            const { data: memberData, error: memberError } = await supabase
                .from('family_members')
                .select('family_id')
                .eq('user_id', user.id)
                .single();

            if (memberError || !memberData) {
                // User not in family, no budget
                setFamilyBudget(null);
                setLoading(false);
                return;
            }

            // 2. Get Current Month's Budget
            const { data: budgetData, error: budgetError } = await supabase
                .from('family_budgets')
                .select(`
                    id, 
                    family_id, 
                    total_amount, 
                    status, 
                    month,
                    family_budget_contributions (amount)
                `)
                .eq('family_id', memberData.family_id)
                .eq('month', currentMonth)
                .single();

            if (budgetError || !budgetData) {
                setFamilyBudget(null);
                setLoading(false);
                return;
            }

            // Calculate contributions
            const totalContributed = (budgetData.family_budget_contributions || [])
                .reduce((sum: number, c: any) => sum + Number(c.amount), 0);

            let spendingLimits: Record<string, number> = {};
            let spentByUser: Record<string, number> = {};
            let totalSpent = 0;

            if (budgetData.status === 'spending') {
                // 3. Get Spending Limits
                const { data: limitsData } = await supabase
                    .from('family_spending_limits')
                    .select('user_id, limit_amount')
                    .eq('family_budget_id', budgetData.id);

                if (limitsData) {
                    spendingLimits = limitsData.reduce((acc: any, item: any) => {
                        acc[item.user_id] = Number(item.limit_amount);
                        return acc;
                    }, {});
                }

                // 4. Get Expenses linked to this budget
                const { data: expensesData } = await supabase
                    .from('expenses')
                    .select('user_id, amount')
                    .eq('family_budget_id', budgetData.id);

                if (expensesData) {
                    spentByUser = expensesData.reduce((acc: any, item: any) => {
                        acc[item.user_id] = (acc[item.user_id] || 0) + Number(item.amount);
                        return acc;
                    }, {});

                    totalSpent = expensesData.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
                }
            }

            const data: FamilyBudgetData = {
                id: budgetData.id,
                family_id: budgetData.family_id,
                total_amount: budgetData.total_amount,
                total_contributed: totalContributed,
                total_spent: totalSpent,
                status: budgetData.status,
                month: budgetData.month,
                spending_limits: spendingLimits,
                spent_by_user: spentByUser,
                remaining_budget: totalContributed - totalSpent,
                user_limit: spendingLimits[user.id] || 0,
                user_remaining_limit: Math.max(0, (spendingLimits[user.id] || 0) - (spentByUser[user.id] || 0))
            };

            setFamilyBudget(data);

        } catch (err: any) {
            console.error("Error fetching family budget:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFamilyBudget();
    }, [user]);

    return { familyBudget, loading, error, refreshFamilyBudget: fetchFamilyBudget };
}
