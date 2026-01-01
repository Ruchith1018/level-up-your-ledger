import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface LeaderboardReward {
    id: string;
    user_id: string;
    period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    period_date: string;
    category: 'tasks' | 'xp';
    rank: number;
    tokens_awarded: number;
    awarded_at: string;
    claimed: boolean;
}

export const useLeaderboardRewards = () => {
    const { user } = useAuth();

    const processRewards = async (periodType: 'daily' | 'weekly' | 'monthly' | 'yearly', periodDate?: string) => {
        try {
            const { data, error } = await supabase.rpc('process_leaderboard_rewards', {
                p_period_type: periodType,
                p_period_date: periodDate || new Date().toISOString().split('T')[0]
            });

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Error processing rewards:', error);
            return null;
        }
    };

    const getUnclaimedRewards = async () => {
        if (!user) return [];

        try {
            const { data, error } = await supabase
                .from('leaderboard_rewards')
                .select('*')
                .eq('user_id', user.id)
                .eq('claimed', false)
                .order('awarded_at', { ascending: false });

            if (error) throw error;
            return data as LeaderboardReward[];
        } catch (error) {
            console.error('Error fetching unclaimed rewards:', error);
            return [];
        }
    };

    const claimReward = async (rewardId: string) => {
        if (!user) return false;

        try {
            // Get reward details first
            const { data: reward, error: fetchError } = await supabase
                .from('leaderboard_rewards')
                .select('*')
                .eq('id', rewardId)
                .eq('user_id', user.id)
                .single();

            if (fetchError) throw fetchError;

            // Mark as claimed
            const { error: updateError } = await supabase
                .from('leaderboard_rewards')
                .update({ claimed: true })
                .eq('id', rewardId);

            if (updateError) throw updateError;

            // Add tokens to user's gamification profile
            const { data: profile } = await supabase
                .from('gamification_profiles')
                .select('coins')
                .eq('user_id', user.id)
                .single();

            const newCoins = (profile?.coins || 0) + reward.tokens_awarded;

            const { error: coinsError } = await supabase
                .from('gamification_profiles')
                .update({ coins: newCoins })
                .eq('user_id', user.id);

            if (coinsError) throw coinsError;

            toast.success(`Claimed ${reward.tokens_awarded} tokens!`);
            return true;
        } catch (error: any) {
            console.error('Error claiming reward:', error);
            toast.error('Failed to claim reward');
            return false;
        }
    };

    const checkAndProcessPendingPeriods = async () => {
        const now = new Date();
        const currentHour = now.getHours();

        // Only process if it's past 11:00 PM (23:00)
        if (currentHour >= 23) {
            const today = now.toISOString().split('T')[0];

            // Check and process daily rewards
            await processRewards('daily', today);

            // Check if it's end of week (Sunday)
            if (now.getDay() === 0) {
                await processRewards('weekly', today);
            }

            // Check if it's end of month
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (tomorrow.getDate() === 1) {
                await processRewards('monthly', today);
            }

            // Check if it's end of year (Dec 31)
            if (now.getMonth() === 11 && now.getDate() === 31) {
                await processRewards('yearly', today);
            }
        }
    };

    return {
        processRewards,
        getUnclaimedRewards,
        claimReward,
        checkAndProcessPendingPeriods
    };
};
