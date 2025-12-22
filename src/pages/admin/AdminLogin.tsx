import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: isValid, error } = await supabase.rpc('verify_admin_credentials', {
                p_username: username,
                p_password: password
            });

            if (error) {
                console.error("Login verification error:", error);
                toast.error("Authentication failed. Please try again.");
            } else if (isValid) {
                toast.success("Welcome back, Admin!");
                localStorage.setItem("admin_auth", "true");
                navigate("/admin/dashboard");
            } else {
                toast.error("Invalid username or password");
                setPassword("");
            }
        } catch (err) {
            console.error("Unexpected login error:", err);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-900 px-4">
            <Card className="w-full max-w-sm shadow-xl border-gray-200 dark:border-gray-800">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
                    <CardDescription>Enter your secure credentials to continue</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter admin username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter secure password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Access Dashboard
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
