import { cn } from "@/lib/utils";

export function Footer() {
    return (
        <footer className={cn(
            "w-full pt-0 text-center text-xs text-muted-foreground",
            "pb-12 md:pb-6" // Extra padding on mobile to clear Bottom Nav
        )}>
            <p>© 2025 BudGlio. All rights reserved.</p>
        </footer>
    );
}
