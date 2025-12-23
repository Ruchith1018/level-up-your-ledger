import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function FamilyPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
                <div className="p-6 bg-primary/10 rounded-full">
                    <Construction className="w-16 h-16 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                        Family Page
                    </h1>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        This feature is currently under construction. Stay tuned for updates!
                    </p>
                </div>

                <Card className="w-full max-w-md border-dashed border-2">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">
                            We are working hard to bring you the best family finance tracking experience.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
