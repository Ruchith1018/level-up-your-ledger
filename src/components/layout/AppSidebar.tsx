import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Calendar, Home, ShoppingBag, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useAuth();

    const navItems = [
        {
            label: "Home",
            icon: Home,
            path: "/dashboard",
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

    const handleSignOut = async () => {
        await signOut();
        navigate("/auth");
    };

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
                                "w-full justify-start gap-3 text-base h-12 font-medium",
                                isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                                !isActive && "text-muted-foreground"
                            )}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </Button>
                    );
                })}
            </div>

            {/* Footer / User Actions */}
            <div className="p-4 mt-auto">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleSignOut}
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
