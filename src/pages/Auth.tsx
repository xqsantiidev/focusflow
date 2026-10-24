import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);
  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);

      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);

      setError("The verification code you entered is incorrect.");
      setIsLoading(false);

      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(`Failed to sign in as guest: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <main className="sketchbook auth-page min-h-screen">
      <div className="auth-layout">
        <Card className="auth-card w-full border">
          <header className="auth-brand">
            <button type="button" onClick={() => navigate("/")} aria-label="Thyme home" className="auth-leaf-mark">
              <svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 25.5C13.1 20.5 17.6 15.2 23.7 6.5" strokeWidth="2.1" />
                <path d="M11.4 22.2C6.8 22.9 4.8 20 5.2 16.8c3.4-.5 6.1.9 6.2 4.4" fill="currentColor" strokeWidth="1.35" />
                <path d="M16.1 17.3c-4.2-.2-5.5-3-4.5-5.8 3.2.2 5.4 2.3 4.5 5.8" fill="currentColor" strokeWidth="1.35" />
                <path d="M19.9 12.2c-.8-3.8 1.4-5.8 4.4-5.7.8 3.1-.3 5.8-3.8 6.2" fill="currentColor" strokeWidth="1.35" />
                <path d="M10.1 24.7c1.7 1.8 4 2.5 6.1 2.2" strokeWidth="1.7" />
              </svg>
            </button>
          </header>
          {step === "signIn" ? (
            <>
              <CardHeader className="auth-card-header text-center">
                <CardTitle className="auth-title">Get started</CardTitle>
                <CardDescription>
                  Plan your day, one thoughtful step at a time.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent>
                  
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        name="email"
                        placeholder="name@example.com"
                        type="email"
                        className="pl-9"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="auth-submit"
                      size="icon"
                      aria-label="Continue with email"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                  )}
                  
                  <div className="mt-5">
                    <div className="auth-divider"><span>or continue with</span></div>
                    <div className="auth-social-row" aria-label="Other sign-in options, coming soon">
                      <button type="button" className="auth-social-icon" disabled aria-label="Apple sign-in coming soon">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.37 12.18c.02 2.22 1.95 2.96 1.97 2.97-.02.05-.31 1.07-1.02 2.12-.61.91-1.24 1.82-2.23 1.84-.97.02-1.28-.59-2.39-.59-1.1 0-1.45.57-2.37.61-.95.04-1.68-.99-2.29-1.9-1.25-1.86-2.2-5.25-.92-7.54a3.55 3.55 0 0 1 2.98-1.82c.93-.02 1.8.64 2.38.64.57 0 1.64-.79 2.77-.67.47.02 1.79.19 2.64 1.44-.07.04-1.58.92-1.56 2.9ZM14.55 6.6a3.5 3.5 0 0 0 .8-2.5 3.56 3.56 0 0 0-2.3 1.18 3.3 3.3 0 0 0-.82 2.42 2.95 2.95 0 0 0 2.32-1.1Z" /></svg>
                      </button>
                      <button type="button" className="auth-social-icon auth-google-icon" disabled aria-label="Google sign-in coming soon">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.95 2.94v2.45h3.16c1.85-1.7 2.9-4.2 2.9-7.26Z"/><path fill="#34A853" d="M12 21.75c2.64 0 4.86-.88 6.48-2.38l-3.16-2.45c-.88.59-2 .94-3.32.94-2.55 0-4.71-1.72-5.49-4.04H3.25v2.53A9.78 9.78 0 0 0 12 21.75Z"/><path fill="#FBBC05" d="M6.51 13.82a5.88 5.88 0 0 1 0-3.64V7.65H3.25a9.78 9.78 0 0 0 0 8.7l3.26-2.53Z"/><path fill="#EA4335" d="M12 6.14c1.44 0 2.73.5 3.75 1.5l2.81-2.82C16.85 3.2 14.64 2.25 12 2.25a9.78 9.78 0 0 0-8.75 5.4l3.26 2.53c.78-2.32 2.94-4.04 5.49-4.04Z"/></svg>
                      </button>
                      <button type="button" className="auth-social-icon auth-facebook-icon" disabled aria-label="Facebook sign-in coming soon">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.4 21v-8.2h2.75l.41-3.2H13.4V7.56c0-.93.26-1.56 1.59-1.56h1.7V3.14c-.3-.04-1.34-.14-2.55-.14-2.53 0-4.26 1.54-4.26 4.37V9.6H7v3.2h2.88V21h3.52Z"/></svg>
                      </button>
                    </div>
                    <p className="auth-coming-soon">Apple, Google &amp; Facebook sign-in coming soon</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-4"
                      onClick={handleGuestLogin}
                      disabled={isLoading}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Continue as Guest
                    </Button>
                  </div>
                </CardContent>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="auth-card-header text-center">
                <CardTitle className="auth-title">Check your email</CardTitle>
                <CardDescription>
                  We've sent a code to {step.email}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="pb-4">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />

                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                          // Find the closest form and submit it
                          const form = (e.target as HTMLElement).closest("form");
                          if (form) {
                            form.requestSubmit();
                          }
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500 text-center">
                      {error}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Didn't receive a code?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => setStep("signIn")}
                    >
                      Try again
                    </Button>
                  </p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify code
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("signIn")}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Use different email
                  </Button>
                </CardFooter>
              </form>
            </>
          )}

          <div className="auth-card-footer py-4 px-6 text-xs text-center text-muted-foreground border-t space-y-1">
            <div>
              <button onClick={() => navigate("/privacy")} className="underline hover:text-primary transition-colors cursor-pointer">privacy</button>
              <span className="mx-1.5 opacity-30">·</span>
              <button onClick={() => navigate("/terms")} className="underline hover:text-primary transition-colors cursor-pointer">terms</button>
            </div>
            <div>
              Secured by{" "}
              <a
                href="https://freebuff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary transition-colors"
              >
                freebuff.com
              </a>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
