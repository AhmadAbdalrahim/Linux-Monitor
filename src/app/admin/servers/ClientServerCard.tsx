"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Terminal } from "lucide-react";
import Link from "next/link";

export default function ClientServerCard({ server }: { server: any }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const isOnline = Date.now() - new Date(server.lastSeenAt).getTime() < 5 * 60 * 1000;

  async function handleDelete() {
    if (!confirm(`Are you sure you want to permanently delete the server "${server.name}"?`)) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/servers/${server.id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete server");
      }
    } catch {
      alert("Error deleting server");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-opacity ${isDeleting ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card-hover)]">
            <Terminal className="h-5 w-5 text-[var(--text-muted)]" />
          </div>
          <div className="min-w-0">
            <Link href={`/dashboard/servers/${server.id}`} className="truncate font-semibold tracking-tight hover:text-[var(--accent)] transition-colors inline-block">
              {server.name}
            </Link>
            <p className="truncate text-xs text-[var(--text-muted)]">{server.hostname}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {isOnline && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75"></span>}
            <span className={`relative inline-flex h-3 w-3 rounded-full ${isOnline ? 'bg-[var(--accent)]' : 'bg-[var(--text-muted)]'}`}></span>
          </span>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-md transition-colors"
            title="Delete server globally"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="text-sm text-[var(--text-muted)] mb-4">
        <p className="flex justify-between items-center py-1">
          Owner: <Link href={`/admin/servers?userId=${server.userId}`} className="text-[var(--text)] hover:text-[var(--accent)] hover:underline truncate ml-2 max-w-[200px]">{server.user?.email || "Unknown"}</Link>
        </p>
        <p className="flex justify-between">OS: <span className="text-[var(--text)]">{server.os || "Waiting..."}</span></p>
        <p className="flex justify-between">Agent Key: <span className="font-mono text-xs">{server.agentKey.slice(0, 12)}...</span></p>
      </div>
    </div>
  );
}
