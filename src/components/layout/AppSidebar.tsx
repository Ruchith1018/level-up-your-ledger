import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Calendar, Home, ShoppingBag, Settings, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { useGamification } from "@/contexts/GamificationContext";

import { useRef, useEffect } from "react";
import { playNotificationSound } from "@/utils/audio";

export function AppSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { claimableBadges, unclaimedTaskItems, dismissedIds, redeemableItems } = useGamification();

    const notificationCount =
        (claimableBadges?.filter(id => !dismissedIds?.includes(`badge-${id}`))?.length || 0) +
        (unclaimedTaskItems?.filter(task => !dismissedIds?.includes(`task-${task.uniqueId}`))?.length || 0) +
        (redeemableItems?.filter(item => !dismissedIds?.includes(`redeem-${item.value}`))?.length || 0);
    const prevCountRef = useRef(notificationCount);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            prevCountRef.current = notificationCount;
            return;
        }

        if (notificationCount > prevCountRef.current) {
            playNotificationSound();
        }

        prevCountRef.current = notificationCount;
    }, [notificationCount]);

    const navItems = [
        {
            label: "Home",
            icon: Home,
            path: "/dashboard",
        },
        {
            label: "Notifications",
            icon: Bell,
            path: "/notifications",
        },
        {
            label: "Analytics",
            icon: BarChart3,
            path: "/analytics",
        },
        {
            label: "Subscriptions",
            icon: Calendar,
            path: "/subscriptions",
        },
        {
            label: "Redeem Shop",
            icon: ShoppingBag,
            path: "/shop",
        },
        {
            label: "Settings",
            icon: Settings,
            path: "/settings",
        },
    ];

    return (
        <div className="hidden md:flex h-screen w-64 flex-col fixed left-0 top-0 border-r bg-card/50 backdrop-blur-xl z-50">
            {/* Header / Logo */}
            <div className="h-[88px] px-6 flex items-center gap-3 border-b border-border">
                <img
                    src="/logo.jpg"
                    alt="BudGlio Logo"
                    className="w-12 h-12 rounded-2xl object-cover shadow-sm"
                />
                <div className="flex flex-col justify-center">
                    <span className="font-bold text-2xl text-green-600 leading-none tracking-tight">BudGlio</span>
                    <span className="text-xs text-muted-foreground font-medium mt-0.5">Gamified Finance Tracker</span>
                </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 py-6 px-3 space-y-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <Button
                            key={item.path}
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-3 text-base h-12 font-medium relative",
                                isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                                !isActive && "text-muted-foreground"
                            )}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                            {item.label === "Notifications" && notificationCount > 0 && (
                                <span className="absolute right-3 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-600 rounded-full animate-bounce shadow-sm">
                                    {notificationCount}
                                </span>
                            )}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
