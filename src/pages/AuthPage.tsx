import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { useTutorial } from "@/contexts/TutorialContext";

export default function AuthPage() {
    const navigate = useNavigate();
    const { startTutorial } = useTutorial();
    const [loading, setLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [referralCode, setReferralCode] = useState("");

    const generateReferralId = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAuthMode('login');
        try {
            await supabase.auth.signOut(); // Ensure clean state

            // Step 1: Verify Password
            const { error: passwordError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (passwordError) throw passwordError;

            // Step 2: If password correct, Sign Out immediately to enforce OTP step for final session
            // We only wanted to verify "Knowledge" (Password) before proceeding to "Possession" (OTP)
            await supabase.auth.signOut();

            // Step 3: Send OTP
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false,
                }
            });

            if (otpError) throw otpError;

            setIsVerifying(true);
            toast.success("Password verified. Please check your email for the OTP.");
        } catch (error: any) {
            toast.error(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const myReferralId = generateReferralId();

            const { error, data } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        referral_id: myReferralId,
                        referred_by: referralCode || null,
                    },
                },
            });

            if (error) throw error;

            // Check if user already exists (Supabase specific check)
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                toast.error("User already exists! Please login instead.");
                return;
            }

            setIsVerifying(true);
            toast.success("Please check your email for the verification code.");
        } catch (error: any) {
            toast.error(error.message || "Failed to register");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: authMode === 'login' ? 'magiclink' : 'signup',
            });

            if (error) throw error;

            toast.success(authMode === 'login' ? "Logged in successfully!" : "Email verified successfully! Logging you in...");

            // Allow time for AuthContext to update via onAuthStateChange
            setTimeout(() => {
                navigate("/");
            }, 500);
        } catch (error: any) {
            toast.error(error.message || "Failed to verify OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center flex flex-col items-center">
                    <img src="/logo.jpg" alt="BudGlio Logo" className="w-16 h-16 rounded-2xl shadow-lg mb-4 object-cover" />
                    <CardTitle className="text-2xl font-bold">Welcome to BudGlio</CardTitle>
                    <CardDescription>
                        Your journey to financial freedom starts here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full" onValueChange={(val) => {
                        setIsVerifying(false);
                        setOtp("");
                        setAuthMode(val as 'login' | 'register');
                    }}>
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="register">Register</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            {isVerifying ? (
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="space-y-4 text-center">
                                        <div className="space-y-2">
                                            <Label>Enter Login Code</Label>
                                            <p className="text-sm text-muted-foreground">
                                                We sent a code to {email}
                                            </p>
                                        </div>
                                        <div className="flex justify-center">
                                            <InputOTP
                                                maxLength={8}
                                                value={otp}
                                                onChange={(value) => setOtp(value)}
                                                pattern="^[0-9]*$"
                                            >
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={0} />
                                                    <InputOTPSlot index={1} />
                                                    <InputOTPSlot index={2} />
                                                    <InputOTPSlot index={3} />
                                                </InputOTPGroup>
                                                <InputOTPSeparator />
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={4} />
                                                    <InputOTPSlot index={5} />
                                                    <InputOTPSlot index={6} />
                                                    <InputOTPSlot index={7} />
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Verify & Login
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full"
                                        onClick={() => setIsVerifying(false)}
                                    >
                                        Back
                                    </Button>
                                </form>
                            ) : (
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
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Verify & Send OTP
                                    </Button>
                                </form>
                            )}
                        </TabsContent>

                        <TabsContent value="register">
                            {isVerifying ? (
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="space-y-4 text-center">
                                        <div className="space-y-2">
                                            <Label>Enter Verification Code</Label>
                                            <p className="text-sm text-muted-foreground">
                                                We sent a code to {email}
                                            </p>
                                        </div>
                                        <div className="flex justify-center">
                                            <InputOTP
                                                maxLength={8}
                                                value={otp}
                                                onChange={(value) => setOtp(value)}
                                                pattern="^[0-9]*$"
                                            >
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={0} />
                                                    <InputOTPSlot index={1} />
                                                    <InputOTPSlot index={2} />
                                                    <InputOTPSlot index={3} />
                                                </InputOTPGroup>
                                                <InputOTPSeparator />
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={4} />
                                                    <InputOTPSlot index={5} />
                                                    <InputOTPSlot index={6} />
                                                    <InputOTPSlot index={7} />
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Verify Email
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full"
                                        onClick={() => setIsVerifying(false)}
                                    >
                                        Back to Register
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="register-email">Email</Label>
                                        <Input
                                            id="register-email"
                                            type="email"
                                            placeholder="name@example.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-password">Password</Label>
                                        <Input
                                            id="register-password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="referral">Referral ID (Optional)</Label>
                                        <Input
                                            id="referral"
                                            placeholder="Enter referral code"
                                            value={referralCode}
                                            onChange={(e) => setReferralCode(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Got a code from a friend? Enter it here to earn bonus XP!
                                        </p>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Create Account
                                    </Button>
                                </form>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
