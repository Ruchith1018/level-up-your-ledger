import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Calendar, Home, Palette, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        {
            label: "Analytics",
            icon: BarChart3,
            path: "/analytics",
        },
        {
            label: "Subs",
            icon: Calendar,
            path: "/subscriptions",
        },
        {
            label: "Home",
            icon: Home,
            path: "/dashboard",
        },
        {
            label: "Shop",
            icon: Palette,
            path: "/shop",
        },
        {
            label: "Settings",
            icon: Settings,
            path: "/settings",
        },
    ];

    if (location.pathname === "/") return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border md:hidden">
            <div className="flex items-center justify-around p-2 pb-safe">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[64px]",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-6 h-6 transition-all",
                                    isActive ? "scale-110" : "scale-100"
                                )}
                            />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
