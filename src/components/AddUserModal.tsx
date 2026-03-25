"use client";
import { useState, useEffect } from "react";
import { X, UserPlus, Shield, User } from "lucide-react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddUserModal({ isOpen, onClose, onAdded }: AddUserModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setName("");
      setIsAdmin(false);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, isAdmin }),
      });

      if (res.ok) {
        onAdded();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create user");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add New User</h2>
              <p className="text-sm text-[var(--text-muted)]">Manually create a new platform user</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Initial Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 transition-all ${
                  !isAdmin 
                    ? "border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)] ring-1 ring-[var(--accent)]" 
                    : "border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)]"
                }`}
              >
                <User className="h-4 w-4" />
                <span className="text-sm font-semibold">User</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAdmin(true)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 transition-all ${
                  isAdmin 
                    ? "border-[#d29922] bg-[#d29922]/5 text-[#d29922] ring-1 ring-[#d29922]" 
                    : "border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)]"
                }`}
              >
                <Shield className="h-4 w-4" />
                <span className="text-sm font-semibold">Admin</span>
              </button>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[var(--accent)] py-3 font-bold text-[var(--accent-text)] shadow-lg shadow-[var(--accent)]/20 transition-all hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
