import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
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
    const [pendingUserData, setPendingUserData] = useState<{
        referral_id: string;
        referred_by: string | null;
    } | null>(null);

    const generateReferralId = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAuthMode('login');
        try {
            // First verify credentials with signInWithPassword
            const { error: passwordError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (passwordError) throw passwordError;

            // If password is correct, sign out and send OTP
            await supabase.auth.signOut();

            // Send OTP for verification
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false,
                }
            });

            if (otpError) throw otpError;

            toast.success("OTP sent to your email!");
            setIsVerifying(true);
        } catch (error: any) {
            toast.error(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAuthMode('register');
        try {
            const myReferralId = generateReferralId();

            // First create the account
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

            // Store pending user data for after verification
            setPendingUserData({
                referral_id: myReferralId,
                referred_by: referralCode || null,
            });

            toast.success("Account created! Please check your email for verification code.");
            setIsVerifying(true);
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
                type: authMode === 'login' ? 'email' : 'signup',
            });

            if (error) throw error;

            toast.success(authMode === 'login' ? "Logged in successfully!" : "Email verified successfully!");

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

    const handleResendOtp = async () => {
        setLoading(true);
        try {
            if (authMode === 'login') {
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        shouldCreateUser: false,
                    }
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email,
                });
                if (error) throw error;
            }
            toast.success("OTP resent to your email!");
        } catch (error: any) {
            toast.error(error.message || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setIsVerifying(false);
        setOtp("");
        setPendingUserData(null);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center flex flex-col items-center">
                    <img src="/logo.jpg" alt="BudGlio Logo" className="w-16 h-16 rounded-2xl shadow-lg mb-4 object-cover" />
                    <CardTitle className="text-2xl font-bold">Welcome to BudGlio</CardTitle>
                    <CardDescription>
                        {isVerifying 
                            ? "Enter the verification code sent to your email"
                            : "Your journey to financial freedom starts here"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isVerifying ? (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-4 text-center">
                                <div className="space-y-2">
                                    <Label className="text-lg font-medium">
                                        {authMode === 'login' ? 'Login Verification' : 'Email Verification'}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        We sent a 6-digit code to <span className="font-medium">{email}</span>
                                    </p>
                                </div>
                                <div className="flex justify-center">
                                    <InputOTP
                                        maxLength={6}
                                        value={otp}
                                        onChange={(value) => setOtp(value)}
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                        </InputOTPGroup>
                                        <InputOTPSeparator />
                                        <InputOTPGroup>
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {authMode === 'login' ? 'Verify & Login' : 'Verify Email'}
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleBack}
                                    disabled={loading}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="flex-1"
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                >
                                    Resend Code
                                </Button>
                            </div>
                        </form>
                    ) : (
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
                                        Continue
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground">
                                        You'll receive a verification code after entering correct credentials
                                    </p>
                                </form>
                            </TabsContent>

                            <TabsContent value="register">
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
                                    <p className="text-xs text-center text-muted-foreground">
                                        You'll receive a verification code to confirm your email
                                    </p>
                                </form>
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
