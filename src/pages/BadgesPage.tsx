import { useGamification } from "@/contexts/GamificationContext";
import { BADGES, getBadgeProgress } from "@/utils/gamify";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { useExpenses } from "@/contexts/ExpenseContext";

export default function BadgesPage() {
    const { state, unlockBadge, isLoading, refreshGamification } = useGamification();
    const { state: expenseState } = useExpenses();
    const { state: budgetState } = useBudget();
    const navigate = useNavigate();
    const [selectedBadge, setSelectedBadge] = useState<typeof BADGES[keyof typeof BADGES] | null>(null);

    useEffect(() => {
        refreshGamification();
    }, []);

    const allBadges = Object.values(BADGES);
    const achievedBadges = allBadges.filter(badge => (state.badges || []).includes(badge.id));
    const lockedBadges = allBadges.filter(badge => !(state.badges || []).includes(badge.id));

    const handleBadgeClick = (badge: typeof allBadges[0]) => {
        setSelectedBadge(badge);
    };

    const BadgeCard = ({ badge, unlocked }: { badge: typeof allBadges[0], unlocked: boolean }) => {
        // Calculate progress to check if claimable
        const progress = getBadgeProgress(badge.id, expenseState.items, state.claimedTasks, state.streak, budgetState);
        const isClaimable = !unlocked && progress.current >= progress.target;

        return (
            <Card
                className={`aspect-square transition-all cursor-pointer hover:scale-105 active:scale-95 relative overflow-hidden ${unlocked ? 'border-primary/50 bg-primary/5' : 'opacity-60 grayscale bg-muted/50'} ${isClaimable ? 'ring-2 ring-green-500 opacity-100 grayscale-0 bg-green-500/10' : ''}`}
                onClick={() => handleBadgeClick(badge)}
            >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3 h-full">
                    <div className={`text-3xl ${unlocked || isClaimable ? '' : 'opacity-50'}`}>
                        {/* @ts-ignore - icon exists now */}
                        {badge.icon || <Trophy className="w-8 h-8" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">{badge.name}</h3>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{badge.description}</p>
                    </div>
                    {unlocked && (
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Unlocked
                        </span>
                    )}
                    {isClaimable && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold text-white bg-green-600 px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                            CLAIM
                        </span>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">All Badges</h1>
                            <p className="text-sm text-muted-foreground">Track your achievements</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-8 max-w-4xl">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                            <img
                                src="/assets/token.png"
                                alt="Loading..."
                                className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
                            />
                        </div>
                        <p className="text-muted-foreground animate-pulse font-medium">Loading badges...</p>
                    </div>
                ) : (
                    <>
                        {/* Achieved Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                                <Trophy className="w-5 h-5" />
                                Achieved ({achievedBadges.length})
                            </h2>
                            {achievedBadges.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {achievedBadges.map(badge => (
                                        <BadgeCard key={badge.id} badge={badge} unlocked={true} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    <p>No badges earned yet. Keep going!</p>
                                </div>
                            )}
                        </motion.div>

                        {/* Locked Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-muted-foreground">
                                <Lock className="w-5 h-5" />
                                Not Achieved ({lockedBadges.length})
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {lockedBadges.map(badge => (
                                    <BadgeCard key={badge.id} badge={badge} unlocked={false} />
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </main>

            <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
                <DialogContent className="sm:max-w-md rounded-xl">
                    <DialogHeader className="items-center text-center gap-2">
                        <div className="text-6xl mb-2">
                            {/* @ts-ignore */}
                            {selectedBadge?.icon || <Trophy className="w-12 h-12" />}
                        </div>
                        <DialogTitle className="text-2xl font-bold">{selectedBadge?.name}</DialogTitle>
                        <DialogDescription className="text-center">
                            {selectedBadge?.description}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBadge && (
                        <div className="space-y-4 py-4">
                            {state.badges.includes(selectedBadge.id) ? (
                                <div className="bg-primary/10 text-primary rounded-lg p-4 text-center font-medium">
                                    🎉 Badge Unlocked!
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {(() => {
                                        const progress = getBadgeProgress(selectedBadge.id, expenseState.items, state.claimedTasks, state.streak, budgetState);
                                        const percentage = Math.min(100, (progress.current / progress.target) * 100);
                                        const isComplete = progress.current >= progress.target;

                                        return (
                                            <>
                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                    <span>Progress</span>
                                                    <span>{progress.current} / {progress.target} {progress.unit}</span>
                                                </div>
                                                <Progress value={percentage} className="h-2" />

                                                {isComplete && (
                                                    <Button
                                                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white animate-pulse"
                                                        onClick={() => {
                                                            unlockBadge(selectedBadge.id);
                                                            // Close dialog or show success? unlockBadge shows toast.
                                                            // Maybe close dialog to refresh state?
                                                            // State update will trigger re-render.
                                                            // If we stay open, it should show "Unlocked!" immediately.
                                                        }}
                                                    >
                                                        Claim Badge
                                                    </Button>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
