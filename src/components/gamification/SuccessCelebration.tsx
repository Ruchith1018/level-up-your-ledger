import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamification } from "@/contexts/GamificationContext";
import { CheckCircle, Gift, ShoppingCart, PartyPopper } from "lucide-react";

export const SuccessCelebration = () => {
    const { successAnimation } = useGamification();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (successAnimation) {
            setIsVisible(true);
            const timer = setTimeout(() => setIsVisible(false), 2900); // Slightly less than context timeout to allow exit anim
            return () => clearTimeout(timer);
        }
    }, [successAnimation]);

    if (!successAnimation) return null;

    const isPurchase = successAnimation.type === 'purchase';
    const title = isPurchase ? "Purchase Success" : "Redemption Done";
    const Icon = isPurchase ? ShoppingCart : Gift;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    {/* Glassy Container */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-white/90 dark:bg-black/80 backdrop-blur-md border border-zinc-200 dark:border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 relative overflow-hidden min-w-[300px]"
                    >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-transparent pointer-events-none" />

                        {/* Animated Icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-green-500/30 blur-xl rounded-full scale-150" />
                            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center relative z-10 border-4 border-green-500">
                                <Icon className="w-12 h-12 text-green-500" />
                            </div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="absolute -bottom-2 -right-2 bg-white dark:bg-black rounded-full p-2 shadow-lg z-20"
                            >
                                <CheckCircle className="w-6 h-6 text-green-500 fill-green-500" />
                            </motion.div>
                        </motion.div>

                        {/* Text */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-center z-10"
                        >
                            <h2 className="text-2xl font-black text-zinc-800 dark:text-white drop-shadow-sm uppercase tracking-tight">
                                {title}
                            </h2>
                            <p className="text-zinc-500 dark:text-white/60 text-sm font-medium mt-1">
                                {successAnimation.item}
                            </p>
                        </motion.div>

                        {/* Confetti Particles (Simplified CSS/Motion) */}
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], x: (i % 2 === 0 ? 50 : -50) * Math.random(), y: -100 * Math.random() }}
                                transition={{ duration: 1, delay: 0.3 + (i * 0.1), repeat: 0 }}
                                className={`absolute bottom-1/2 left-1/2 w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-yellow-400' : 'bg-green-400'}`}
                            />
                        ))}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
