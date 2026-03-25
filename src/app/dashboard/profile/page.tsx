"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, User, Key, Save } from "lucide-react";
import Link from "next/link";
import { ThemeSelector } from "@/components/ThemeSelector";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setEmail(data.user.email);
          setName(data.user.name || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currentPassword, newPassword }),
      });

      if (res.ok) {
        setMsg({ type: "success", text: "Profile updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        // trigger UserProfile component to reload (soft refresh)
        window.dispatchEvent(new Event("focus")); 
      } else {
        const data = await res.json();
        setMsg({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch {
      setMsg({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>
          <ThemeSelector />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="h-8 w-8 text-[var(--accent)]" /> Your Profile
          </h1>
          <p className="text-[var(--text-muted)] mt-2">Manage your personal information and security settings.</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 md:p-8 shadow-sm">
          {msg && (
            <div className={`mb-6 p-4 rounded-lg text-sm border font-medium ${
              msg.type === "success" 
                ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30" 
                : "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30"
            }`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b border-[var(--border)] pb-2">Personal Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1 ml-1">Email cannot be changed directly.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Linus Torvalds"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-semibold border-b border-[var(--border)] pb-2 flex items-center gap-2">
                <Key className="h-5 w-5 text-[var(--text-muted)]" /> Security
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Required if changing password"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--border)]">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-white transition-all hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Profile Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
