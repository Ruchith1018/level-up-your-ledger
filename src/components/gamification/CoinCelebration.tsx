import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamification } from "@/contexts/GamificationContext";

export const CoinCelebration = () => {
    const { coinAnimation } = useGamification();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (coinAnimation) {
            setIsVisible(true);
            const timer = setTimeout(() => setIsVisible(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [coinAnimation]);

    return (
        <AnimatePresence>
            {isVisible && coinAnimation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    {/* Glassy Container */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-white/90 dark:bg-black/80 backdrop-blur-md border border-zinc-200 dark:border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 relative overflow-hidden"
                    >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent pointer-events-none" />

                        {/* Spinning Coin */}
                        <motion.div
                            animate={{
                                rotateY: [0, 360 * 3],
                                scale: [1, 1.2, 1]
                            }}
                            transition={{
                                duration: 2,
                                ease: "easeInOut",
                                times: [0, 1]
                            }}
                            className="relative"
                        >
                            {/* Glow behind coin */}
                            <div className="absolute inset-0 bg-yellow-500/50 blur-xl rounded-full scale-150" />
                            <img
                                src="/assets/token.png"
                                alt="Budglio Token"
                                className="w-24 h-24 object-contain relative z-10 drop-shadow-lg"
                            />
                        </motion.div>

                        {/* Text */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-center"
                        >
                            <div className="text-4xl font-black text-yellow-500 dark:text-yellow-400 drop-shadow-md flex items-center justify-center gap-1">

                                <span>{coinAnimation.amount}</span>
                            </div>
                            <div className="text-zinc-600 dark:text-white/80 text-sm font-bold uppercase tracking-widest mt-1">

                                Tokens Earned
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
