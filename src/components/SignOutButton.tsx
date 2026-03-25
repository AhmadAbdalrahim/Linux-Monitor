"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/?logout=success");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      title="Sign Out"
      className="flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text)] transition-colors"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
