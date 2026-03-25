"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import Link from "next/link";

export default function ClientUserRow({ user }: { user: any }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);

  async function handleToggleRole() {
    if (user.isAdmin && !confirm(`Are you sure you want to revoke Admin rights for ${user.email}?`)) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update role.");
      }
    } catch {
      alert("Error updating role.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete() {
    if (user.isAdmin) {
      alert("Cannot delete an admin user from this interface. Demote them first.");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${user.email}? This will delete all their servers and metrics immediately.`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete user.");
      }
    } catch {
      alert("Error deleting user.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <tr className="hover:bg-[var(--bg-card-hover)] transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {user.isUserActive && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75"></span>}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${user.isUserActive ? 'bg-[var(--accent)]' : 'bg-[var(--text-muted)] opacity-50'}`}></span>
          </span>
          <span className={`text-xs font-medium ${user.isUserActive ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
            {user.isUserActive ? "Online" : "Offline"}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 font-medium">{user.email}</td>
      <td className="px-6 py-4 text-[var(--text-muted)]">{user.name || "—"}</td>
      <td className="px-6 py-4">
        {user.isAdmin ? (
          <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-500">
            Admin
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-[var(--text-muted)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--text-muted)]">
            User
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col text-[11px] font-medium leading-tight">
          <span className="text-[var(--accent)]">{user.onlineServers === 0 && user.offlineServers === 0 ? "0" : user.onlineServers} Online</span>
          {user.offlineServers > 0 && <span className="text-[var(--text-muted)]">{user.offlineServers} Offline</span>}
        </div>
      </td>
      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
        <Link
          href={`/admin/servers?userId=${user.id}`}
          className="text-xs font-medium px-3 py-1.5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
        >
          View Servers
        </Link>
        <button
          onClick={handleToggleRole}
          disabled={isUpdating}
          className="text-xs font-medium px-3 py-1.5 rounded-md bg-[var(--bg-card-hover)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors disabled:opacity-50"
        >
          {user.isAdmin ? "Revoke Admin" : "Make Admin"}
        </button>
        {!user.isAdmin && (
          <button
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-md transition-colors disabled:opacity-50"
            title="Delete User"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </td>
    </tr>
  );
}
