import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";
import { CoinCelebration } from "@/components/gamification/CoinCelebration";
import { SuccessCelebration } from "@/components/gamification/SuccessCelebration";

export function AppLayout() {
    const location = useLocation();
    const isNotificationsPage = location.pathname === "/notifications";

    return (
        <div className="min-h-screen w-full bg-background font-sans antialiased">
            <CoinCelebration />
            <SuccessCelebration />
            <AppSidebar />
            <main className="flex-1 md:pl-64 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
                <div className="flex-1">
                    <Outlet />
                </div>
                <Footer />
            </main>
            {!isNotificationsPage && <BottomNav />}
        </div>
    );
}
