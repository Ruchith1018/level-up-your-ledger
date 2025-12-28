import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <Construction className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl">Profile Page</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        Under Development
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        We're working hard to bring you an amazing profile experience.
                        This page will be available soon!
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
