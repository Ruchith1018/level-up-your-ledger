import { useGamification } from "@/contexts/GamificationContext";
import { xpThreshold } from "@/utils/gamify";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Trophy, Coins, Flame } from "lucide-react";

export function XPBar() {
  const { state } = useGamification();
  const nextLevelXP = xpThreshold(state.level);
  const progress = (state.xp / nextLevelXP) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-4 border border-border shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-gradient-to-br from-xp to-accent text-xp-foreground rounded-lg px-3 py-1.5 font-bold text-sm flex items-center gap-1.5 shadow-sm">
            <Trophy className="w-4 h-4" />
            <span className="whitespace-nowrap">Level {state.level}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gold/10 text-gold rounded-lg px-2.5 py-1.5 font-semibold text-sm border border-gold/20">
            <Coins className="w-4 h-4" />
            <span>{state.coins}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-destructive/10 text-destructive rounded-lg px-2.5 py-1.5 font-semibold text-sm border border-destructive/20">
            <Flame className="w-4 h-4" />
            <span className="whitespace-nowrap">{state.streak} day{state.streak !== 1 && "s"}</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground font-medium ml-auto sm:ml-0">
          {state.xp} / {nextLevelXP} XP
        </div>
      </div>
      <Progress value={progress} className="h-3" />
    </motion.div>
  );
}
