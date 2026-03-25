"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCircle, ShieldAlert } from "lucide-react";

export function UserProfile({ hideAdminLink }: { hideAdminLink?: boolean }) {
  const [user, setUser] = useState<{ email: string; name: string | null; isAdmin: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  if (!user) return <div className="h-8 w-24 animate-pulse bg-[var(--bg-card)] rounded-full border border-[var(--border)]"></div>;

  return (
    <div className="flex items-center gap-3">
      {user.isAdmin && !hideAdminLink && (
        <Link 
          href="/admin" 
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-500 text-xs font-bold hover:bg-purple-500/20 transition-colors"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          Admin Portal
        </Link>
      )}
      <Link href="/dashboard/profile" className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer group">
        <div className="flex h-7 w-7 items-center justify-center bg-[var(--accent)] text-white rounded-full text-xs font-bold uppercase shrink-0 group-hover:scale-105 transition-transform">
          {user.name ? user.name[0] : user.email[0]}
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-[11px] font-bold leading-tight max-w-[120px] truncate text-[var(--text)]" title={user.name || "User"}>
            {user.name || "User"}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] leading-tight max-w-[120px] truncate" title={user.email}>
            {user.email}
          </span>
        </div>
      </Link>
    </div>
  );
}
