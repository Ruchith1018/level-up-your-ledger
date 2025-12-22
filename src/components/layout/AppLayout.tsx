import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";

export function AppLayout() {
    return (
        <div className="min-h-screen w-full bg-background font-sans antialiased">
            <AppSidebar />
            <main className="flex-1 md:pl-64 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
                <div className="flex-1">
                    <Outlet />
                </div>
                <Footer />
            </main>
            <BottomNav />
        </div>
    );
}
