"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BrainCircuit,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { GoogleButton } from "@/components/ui/GoogleButton";
import { useCareerStore } from "@/lib/store/career-store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setFullProfile } = useCareerStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account linking state (Scenario C)
  const isLinkingRequired = searchParams.get("link") === "required";
  const linkEmailParam = searchParams.get("email") || "";
  const [linkingPassword, setLinkingPassword] = useState("");
  const [isLinkingLoading, setIsLinkingLoading] = useState(false);
  const [linkingError, setLinkingError] = useState<string | null>(null);

  // Parse OAuth error query parameters
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (!errorParam) return;

    switch (errorParam) {
      case "cancelled":
        setError("Google sign-in was cancelled.");
        break;
      case "google_not_configured":
        setError(
          "Google Sign-In is not configured yet. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables."
        );
        break;
      case "invalid_state":
        setError("Your sign-in session expired or was invalid. Please try again.");
        break;
      case "unverified_email":
        setError("Your Google account email is not verified. Please verify your email with Google.");
        break;
      case "oauth_failed":
      case "oauth_exchange_failed":
        setError("Could not complete authentication with Google. Please try again.");
        break;
      case "auth_required":
        setError("Please sign in to link your account.");
        break;
      default:
        setError("An authentication error occurred. Please try again.");
    }
  }, [searchParams]);

  // Standard Email/Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.profile) {
        setFullProfile(data.profile);
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      setError(msg);
      setIsLoading(false);
    }
  };

  // Secure Account Linking with Password Verification (Scenario C)
  const handleVerifyAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinkingLoading(true);
    setLinkingError(null);

    try {
      const res = await fetch("/api/auth/link-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: linkingPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify account password");
      }

      if (data.profile) {
        setFullProfile(data.profile);
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password verification failed";
      setLinkingError(msg);
      setIsLinkingLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("demo@careerpilot.ai");
    setPassword("demo123");
    setError(null);
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
      {/* ============================================================ */}
      {/* SCENARIO C: ACCOUNT LINKING VERIFICATION MODAL / CARD */}
      {/* ============================================================ */}
      {isLinkingRequired ? (
        <Card className="bg-[#1e293b]/95 backdrop-blur-md border border-blue-500/50 p-6 sm:p-8 shadow-2xl rounded-2xl animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Link Google to Existing Account</h3>
              <p className="text-xs text-slate-400">Account ownership verification required</p>
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-700/70 rounded-xl text-xs text-slate-300 mb-5 leading-relaxed">
            An existing CareerPilot account with email{" "}
            <strong className="text-blue-300 font-semibold">{linkEmailParam}</strong> already
            exists using email &amp; password.
            <div className="mt-2 text-slate-400">
              To securely connect your Google account, please enter your existing account password to
              verify ownership.
            </div>
          </div>

          {linkingError && (
            <Alert variant="error" className="mb-4" title="Verification Failed">
              {linkingError}
            </Alert>
          )}

          <form onSubmit={handleVerifyAndLink} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Existing Account Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={linkingPassword}
                  onChange={(e) => setLinkingPassword(e.target.value)}
                  placeholder="Enter your existing account password"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLinkingLoading}
              className="w-full justify-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-blue-500/20"
              rightIcon={!isLinkingLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
            >
              {isLinkingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying &amp; Linking...
                </>
              ) : (
                "Verify Password & Link Google"
              )}
            </Button>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Cancel and sign in with email
            </button>
          </form>
        </Card>
      ) : (
        /* STANDARD LOGIN CARD WITH GOOGLE OAUTH */
        <Card className="bg-[#1e293b]/90 backdrop-blur-md border border-slate-700/60 p-6 sm:p-8 shadow-2xl rounded-2xl">
          {error && (
            <Alert variant="error" className="mb-6" title="Authentication Notice">
              {error}
            </Alert>
          )}

          {/* 1. GOOGLE AUTHENTICATION BUTTON */}
          <div className="mb-5">
            <GoogleButton text="Continue with Google" />
          </div>

          {/* SEPARATOR */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1e293b] px-3 text-slate-400 font-semibold tracking-wider">
                or
              </span>
            </div>
          </div>

          {/* 2. EMAIL & PASSWORD FORM */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@university.edu"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-blue-500/20"
                rightIcon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>
          </form>

          {/* Quick Demo Fill button */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-300 font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Quick Fill Demo Student Credentials (Alex Rivera)
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-700/50 text-center">
            <p className="text-xs text-slate-400">
              Don&apos;t have an account yet?{" "}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold ml-1">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-blue-200 bg-clip-text text-transparent">
            CareerPilot
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-white">Welcome Back</h2>
        <p className="text-sm text-slate-400 mt-1">
          Sign in to access your living career profile and AI guidance.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="sm:mx-auto sm:w-full sm:max-w-md p-8 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
