import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Calendar, Home, Palette, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect, useRef } from "react";

function BottomNavContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth - 32 : 0);

    const navItems = useMemo(() => [
        {
            label: "Analytics",
            icon: BarChart3,
            path: "/analytics",
            id: "nav-analytics-mobile"
        },
        {
            label: "Subs",
            icon: Calendar,
            path: "/subscriptions",
            id: "nav-subscriptions-mobile"
        },
        {
            label: "Home",
            icon: Home,
            path: "/dashboard",
            id: "nav-home-mobile"
        },
        {
            label: "Redeem",
            icon: Palette,
            path: "/shop",
            id: "nav-shop-mobile"
        },
        {
            label: "Settings",
            icon: Settings,
            path: "/settings",
            id: "nav-settings-mobile"
        },
    ], []);

    const activeIndex = navItems.findIndex(item => item.path === location.pathname);
    const safeActiveIndex = activeIndex === -1 ? 2 : activeIndex;

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0) {
                    setWidth(entry.contentRect.width);
                }
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Calculate Path
    const path = useMemo(() => {
        if (width <= 0) return "M0,0 L0,0 L0,64 L0,64 Z";

        const itemWidth = width / 5;
        const centerX = (safeActiveIndex * itemWidth) + (itemWidth / 2);
        const notchWidth = 96;
        const notchStart = centerX - (notchWidth / 2);
        const notchEnd = centerX + (notchWidth / 2);

        // Inset by 1px to avoid stroke clipping
        // Radius is 31px (32px - 1px inset)
        return `M32,1 L${notchStart},1 C${notchStart + 20},1 ${notchStart + 20},41 ${centerX},41 C${notchEnd - 20},41 ${notchEnd - 20},1 ${notchEnd},1 L${width - 32},1 A31,31 0 0 1 ${width - 32},63 L32,63 A31,31 0 0 1 32,1 Z`;
    }, [width, safeActiveIndex]);

    return (
        <motion.div
            className="fixed bottom-6 left-4 right-4 z-50 md:hidden"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div ref={containerRef} className="relative h-16 w-full">

                {/* Animated Background Layer */}
                <div className="absolute inset-0 drop-shadow-xl pointer-events-none rounded-[2rem] overflow-hidden">
                    {/* Glass Body */}
                    <motion.div
                        className="absolute inset-0 bg-white/90 dark:bg-card/90 backdrop-blur-[50px]"
                        style={{
                            clipPath: `path("${path || "M0,0 L0,0 L0,64 L0,64 Z"}")`
                        }}
                        initial={{
                            clipPath: `path("${path || "M0,0 L0,0 L0,64 L0,64 Z"}")`
                        }}
                        animate={{
                            clipPath: `path("${path || "M0,0 L0,0 L0,64 L0,64 Z"}")`
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />

                    {/* Border Stroke */}
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox={`0 0 ${width} 64`}
                        preserveAspectRatio="none"
                    >
                        <motion.path
                            d={path || "M0,0 L0,0 L0,64 L0,64 Z"}
                            fill="none"
                            className="stroke-primary/40"
                            strokeWidth="1"
                            initial={{ d: path || "M0,0 L0,0 L0,64 L0,64 Z" }}
                            animate={{ d: path || "M0,0 L0,0 L0,64 L0,64 Z" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    </svg>
                </div>

                {/* Items Layer */}
                <div className="absolute inset-0 grid grid-cols-5 items-center">
                    {navItems.map((item, index) => {
                        const isActive = index === safeActiveIndex;
                        return (
                            <div key={item.path} className="flex justify-center">
                                <motion.button
                                    id={item.id}
                                    onClick={() => navigate(item.path)}
                                    className={cn(
                                        "relative flex items-center justify-center rounded-full transition-colors",
                                        isActive
                                            ? "w-14 h-14 bg-primary text-primary-foreground shadow-lg shadow-primary/40"
                                            : "w-12 h-12 text-muted-foreground hover:text-foreground"
                                    )}
                                    animate={{
                                        y: isActive ? -28 : 0, // Float up more to sit in notch
                                        scale: isActive ? 1.1 : 1
                                    }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <item.icon className={cn("w-6 h-6", isActive && "w-7 h-7")} />
                                </motion.button>
                            </div>
                        );
                    })}
                </div>

            </div>
        </motion.div>
    );
}

export function BottomNav() {
    const location = useLocation();
    const hiddenRoutes = ["/intro", "/auth", "/gamification", "/income", "/expenses", "/savings", "/referrals"];
    const isHidden = hiddenRoutes.includes(location.pathname);

    return (
        <AnimatePresence>
            {!isHidden && <BottomNavContent />}
        </AnimatePresence>
    );
}
