"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Terminal, ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    
    const logout = searchParams.get("logout");
    if (logout === "success") {
      shownRef.current = true;
      toast.success("Logged out successfully");
      window.history.replaceState(null, "", "/login");
    }
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      shownRef.current = true;
      toast.error("Please sign in to access the dashboard");
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        toast.success("Welcome back!");
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json();
        const msg = data.error || "Failed to login";
        setError(msg);
        toast.error(msg);
      }
    } catch {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--bg)] p-4 text-[var(--text)]">
      <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <Link 
          href="/" 
          className="absolute left-6 top-6 flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] shadow-[0_0_20px_var(--accent)] shadow-[var(--accent)]/40 mb-6 mx-auto">
          <Terminal className="h-6 w-6 text-[var(--accent-text)]" />
        </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-8">Sign in to your account</h2>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/20 border border-[var(--danger)]/50 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2 focus:border-[var(--accent)] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2 focus:border-[var(--accent)] focus:outline-none transition-colors"
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <Link href="/forgot-password" className="text-xs text-[var(--accent)] hover:underline">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 font-bold text-white transition-all hover:bg-[var(--accent-hover)] disabled:opacity-50 mt-2"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 border-t border-[var(--border)] pt-6">
          <p className="text-center text-sm text-[var(--text-muted)] mb-4">Or continue with</p>
          <div className="grid grid-cols-2 gap-4">
            <a href="/api/auth/provider/google" className="flex justify-center items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 font-medium transition-colors hover:bg-[var(--bg-card-hover)]">
              <svg className="w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
              Google
            </a>
            <a href="/api/auth/provider/microsoft" className="flex justify-center items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 font-medium transition-colors hover:bg-[var(--bg-card-hover)]">
              <svg className="w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="windows" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"></path></svg>
              Microsoft
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[var(--accent)] hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
      <Link href="/" className="mt-8 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        &larr; Back to home
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
