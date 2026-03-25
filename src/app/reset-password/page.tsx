"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Terminal } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    if (!token) {
      setMessage("Invalid or missing reset token.");
      setStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to reset password");
        setStatus("error");
      }
    } catch {
      setMessage("An unexpected error occurred");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="mb-6 p-4 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] font-medium">
          Your password has been reset successfully!
        </div>
        <Link href="/login" className="w-full inline-block rounded-lg bg-[var(--accent)] px-4 py-2.5 font-bold text-white transition-all hover:bg-[var(--accent-hover)] mt-2">
          Sign In Now
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/20 border border-[var(--danger)]/50 text-[var(--danger)] text-sm">
          Missing token in URL. Please use the exact link provided.
        </div>
        <Link href="/login" className="text-[var(--accent)] hover:underline">Return to Login</Link>
      </div>
    );
  }

  return (
    <>
      {status === "error" && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/20 border border-[var(--danger)]/50 text-[var(--danger)] text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">New Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2 focus:border-[var(--accent)] focus:outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 font-bold text-white transition-all hover:bg-[var(--accent-hover)] disabled:opacity-50 mt-2"
        >
          {status === "loading" ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--bg)] p-4 text-[var(--text)]">
      <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]">
            <Terminal className="h-6 w-6 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-8">Set new password</h2>

        <Suspense fallback={<div className="text-center text-[var(--text-muted)] text-sm">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
