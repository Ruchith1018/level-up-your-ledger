import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Calendar, Home, ShoppingBag, Settings, Bell, Menu, Sun, Moon, LogOut, MessageSquareWarning, UserPlus, Loader2, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { useGamification } from "@/contexts/GamificationContext";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import emailjs from "@emailjs/browser";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useRef, useEffect, useState } from "react";
import { playNotificationSound } from "@/utils/audio";

export function AppSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user } = useAuth(); // Destructure signOut and user
    const { settings, updateSettings } = useSettings();
    const { claimableBadges, unclaimedTaskItems, dismissedIds, redeemableItems } = useGamification();

    const [showReportDialog, setShowReportDialog] = useState(false);
    const [reportSubject, setReportSubject] = useState("");
    const [reportDescription, setReportDescription] = useState("");
    const [isReporting, setIsReporting] = useState(false);

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
            label: "Family",
            icon: Users,
            path: "/family",
        },
        {
            label: "Leaderboard",
            icon: Trophy,
            path: "/leaderboard",
        },
        {
            label: "Analytics",
            icon: BarChart3,
            path: "/analytics",
            id: "nav-analytics-desktop"
        },
        {
            label: "Subscriptions",
            icon: Calendar,
            path: "/subscriptions",
            id: "nav-subscriptions-desktop"
        },
        {
            label: "Redeem Shop",
            icon: ShoppingBag,
            path: "/shop",
        },
    ];

    const toggleTheme = () => {
        const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
        updateSettings({ theme: newTheme });
    };

    const handleLogout = async () => {
        try {
            await signOut();
            await signOut();
            window.location.href = "/";
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleReportSubmit = async () => {
        if (!reportSubject.trim() || !reportDescription.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsReporting(true);

        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
            toast.error("EmailJS configuration missing. Please report to developer.");
            console.error("Missing EmailJS env keys");
            setIsReporting(false);
            return;
        }

        try {
            await emailjs.send(
                serviceId,
                templateId,
                {
                    report_title: reportSubject,
                    problem_description: reportDescription,
                    user_email: user?.email || "Anonymous",
                    website_link: window.location.origin
                },
                publicKey
            );

            toast.success("Report sent! We'll look into it ASAP.");
            setShowReportDialog(false);
            setReportSubject("");
            setReportDescription("");
        } catch (error) {
            console.error("Email sending failed:", error);
            toast.error("Failed to send report. Please try again later.");
        } finally {
            setIsReporting(false);
        }
    };

    return (
        <>
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
                                id={item.id}
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

                {/* More Menu (Bottom) */}
                <div className="p-3 mt-auto mb-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-base h-12 font-medium text-muted-foreground hover:bg-secondary/50"
                            >
                                <Menu className="w-6 h-6" />
                                <span>More</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-60 mb-2 ml-2 p-2" sideOffset={10}>
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => navigate('/settings')}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={toggleTheme}>
                                    {settings.theme === 'dark' ? (
                                        <Moon className="w-4 h-4 mr-2" />
                                    ) : (
                                        <Sun className="w-4 h-4 mr-2" />
                                    )}
                                    <span>Switch appearance</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowReportDialog(true); }}>
                                    <MessageSquareWarning className="w-4 h-4 mr-2" />
                                    <span>Report a problem</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <div className="h-1 bg-border my-1.5 -mx-1" /> {/* Thicker separator hack or just use Separator */}
                            <DropdownMenuSeparator />

                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => toast.info("Switch account feature coming soon!")}>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    <span>Switch accounts</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Report a Problem</DialogTitle>
                        <DialogDescription>
                            We're sorry you're having trouble. Please describe the issue below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">What is the problem you are facing?</Label>
                            <Input
                                id="subject"
                                placeholder="e.g., App crashes on transaction page"
                                value={reportSubject}
                                onChange={(e) => setReportSubject(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description about it</Label>
                            <Textarea
                                id="description"
                                placeholder="Please provide as much detail as possible..."
                                className="min-h-[100px]"
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReportDialog(false)} disabled={isReporting}>Cancel</Button>
                        <Button onClick={handleReportSubmit} disabled={isReporting || !reportSubject.trim() || !reportDescription.trim()}>
                            {isReporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
