import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
// Removed unused imports: Tabs, InputOTP, etc.

export default function AuthPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { session, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [minLoading, setMinLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setMinLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (session) {
            // Check if there's a redirected-from location
            const from = (location.state as any)?.from?.pathname || "/dashboard";
            navigate(from, { replace: true });
        }
    }, [session, navigate, location]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error: passwordError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (passwordError) throw passwordError;

            toast.success("Logged in successfully!");
            navigate("/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || minLoading || session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-6 bg-background">
                <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
                    <img
                        src="/assets/token.png"
                        alt="Loading..."
                        className="w-24 h-24 animate-[spin_2s_linear_infinite] relative z-10 object-contain"
                    />
                </div>
                <p className="text-muted-foreground animate-pulse font-medium">Verifying session...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center flex flex-col items-center">
                    <img src="/logo.jpg" alt="BudGlio Logo" className="w-16 h-16 rounded-2xl shadow-lg mb-4 object-cover" />
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>
                        Login to access your ledger
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Login
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">No account? </span>
                        <button
                            onClick={() => navigate("/")}
                            className="text-primary hover:underline font-medium"
                        >
                            Register here
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
