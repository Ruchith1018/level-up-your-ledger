import { Construction, Lock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/contexts/SettingsContext";
import { PremiumPackModal } from "@/components/premium/PremiumPackModal";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function FamilyPage() {
    const { settings } = useSettings();
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    if (!settings.hasPremiumPack) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in zoom-in duration-500">
                <PremiumPackModal open={showPremiumModal} onOpenChange={setShowPremiumModal} />
                <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full" />
                        <div className="p-8 bg-violet-100 dark:bg-violet-900/30 rounded-full relative z-10">
                            <Lock className="w-20 h-20 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white p-2 rounded-full border-4 border-background">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="space-y-4 max-w-lg">
                        <h1 className="text-4xl font-bold tracking-tighter">
                            Family Budgeting
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Collaborate, track, and grow your wealth together with your family.
                            This feature is exclusive to Premium Pack members.
                        </p>
                    </div>

                    <Card className="w-full max-w-md border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10">
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm text-left">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                    <span>Shared Expense Tracking</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                    <span>Family Goals</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                    <span>Unified Dashboard</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                    <span>Role Management</span>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                                onClick={() => setShowPremiumModal(true)}
                            >
                                Unlock Premium Pack
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
                <div className="p-6 bg-primary/10 rounded-full">
                    <Construction className="w-16 h-16 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                        Family Dashboard
                    </h1>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Welcome to your Family Dashboard! This section is currently being built.
                    </p>
                </div>

                <Card className="w-full max-w-md border-dashed border-2">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">
                            You have successfully unlocked access.
                            We are working hard to bring you the best family finance tracking experience.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
