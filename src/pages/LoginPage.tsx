import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Mail, Chrome } from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
    const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGoogle = async () => {
        setLoading(true);
        try {
            await loginWithGoogle();
        } catch (err: any) {
            toast.error(err.message || "Google sign-in failed");
        } finally {
            setLoading(false);
        }
    };

    const handleEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Email and password are required");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        try {
            if (isSignUp) {
                await registerWithEmail(email, password);
                toast.success("Account created!");
            } else {
                await loginWithEmail(email, password);
            }
        } catch (err: any) {
            const msg = err.code === "auth/user-not-found"
                ? "No account found with this email"
                : err.code === "auth/wrong-password"
                    ? "Incorrect password"
                    : err.code === "auth/email-already-in-use"
                        ? "Email already in use"
                        : err.message || "Authentication failed";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
            <div className="w-full max-w-sm space-y-6 animate-fade-in">
                {/* Logo */}
                <div className="text-center space-y-2">
                    <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                        <FileText className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">PDFInvoicer</h1>
                    <p className="text-sm text-muted-foreground">
                        GST-compliant invoice generator
                    </p>
                </div>

                {/* Auth Card */}
                <Card className="border-border/50 shadow-lg">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                            {isSignUp ? "Create Account" : "Welcome Back"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {isSignUp
                                ? "Sign up to start creating invoices"
                                : "Sign in to access your invoices"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Google Sign-In */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10 text-sm gap-2"
                            onClick={handleGoogle}
                            disabled={loading}
                        >
                            <Chrome className="h-4 w-4" />
                            Continue with Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    or
                                </span>
                            </div>
                        </div>

                        {/* Email Form */}
                        <form onSubmit={handleEmail} className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs" htmlFor="login-email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-9 text-sm"
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs" htmlFor="login-password">Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-9 text-sm"
                                    disabled={loading}
                                    minLength={6}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-9 text-sm"
                                disabled={loading}
                            >
                                <Mail className="h-3.5 w-3.5 mr-1.5" />
                                {loading
                                    ? "Please wait..."
                                    : isSignUp
                                        ? "Create Account"
                                        : "Sign In"}
                            </Button>
                        </form>

                        <p className="text-center text-xs text-muted-foreground">
                            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                            <button
                                type="button"
                                className="text-primary underline hover:text-primary/80 font-medium"
                                onClick={() => setIsSignUp(!isSignUp)}
                            >
                                {isSignUp ? "Sign In" : "Sign Up"}
                            </button>
                        </p>
                    </CardContent>
                </Card>

                <p className="text-center text-[11px] text-muted-foreground">
                    Your data is stored locally on this device.
                    <br />
                    No data is sent to any server.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
