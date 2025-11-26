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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-xp to-accent text-xp-foreground rounded-lg px-3 py-1.5 font-bold text-sm flex items-center gap-1.5">
            <Trophy className="w-4 h-4" />
            Level {state.level}
          </div>
          <div className="flex items-center gap-1.5 bg-gold/10 text-gold rounded-lg px-2.5 py-1.5 font-semibold text-sm">
            <Coins className="w-4 h-4" />
            {state.coins}
          </div>
          <div className="flex items-center gap-1.5 bg-destructive/10 text-destructive rounded-lg px-2.5 py-1.5 font-semibold text-sm">
            <Flame className="w-4 h-4" />
            {state.streak} day{state.streak !== 1 && "s"}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {state.xp} / {nextLevelXP} XP
        </div>
      </div>
      <Progress value={progress} className="h-3" />
    </motion.div>
  );
}
