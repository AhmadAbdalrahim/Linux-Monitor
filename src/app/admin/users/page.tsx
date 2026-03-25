import { prisma } from "@/lib/prisma";
import { Trash2 } from "lucide-react";
import AdminUserHeader from "./AdminUserHeader";
import ClientUserRow from "./ClientUserRow";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const statusFilter = typeof resolvedParams.status === "string" ? resolvedParams.status : "all";

  const users = await (prisma as any).user.findMany({
    include: {
      servers: {
        select: { lastSeenAt: true },
      },
      sessions: {
        where: { expiresAt: { gt: new Date() } },
        select: { id: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const processedUsers = users.map((user: any) => {
    const isUserActive = user.sessions && user.sessions.length > 0;
    
    let onlineServers = 0;
    let offlineServers = 0;
    for (const s of user.servers || []) {
      if (new Date(s.lastSeenAt) > fiveMinsAgo) onlineServers++;
      else offlineServers++;
    }

    return { ...user, isUserActive, onlineServers, offlineServers };
  });

  let displayUsers = processedUsers;
  if (statusFilter === "active") {
    displayUsers = processedUsers.filter((u: any) => u.isUserActive);
  } else if (statusFilter === "inactive") {
    displayUsers = processedUsers.filter((u: any) => !u.isUserActive);
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <AdminUserHeader />

      <div className="flex items-center gap-3 mb-6">
        <Link 
          href="/admin/users" 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all' ? 'bg-[var(--text)] text-[var(--bg)]' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card-hover)]'}`}
        >
          All ({processedUsers.length})
        </Link>
        <Link 
          href="/admin/users?status=active" 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'active' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-card-hover)]'}`}
        >
          Active Logged-In ({processedUsers.filter((u: any) => u.isUserActive).length})
        </Link>
        <Link 
          href="/admin/users?status=inactive" 
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'inactive' ? 'bg-[var(--danger)] text-white' : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-card-hover)]'}`}
        >
          Offline Users ({processedUsers.filter((u: any) => !u.isUserActive).length})
        </Link>
      </div>
      
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--bg)]/50 border-b border-[var(--border)] text-[var(--text-muted)]">
              <tr>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Servers</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {displayUsers.map((user: any) => (
                <ClientUserRow key={user.id} user={user} />
              ))}
              {displayUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[var(--text-muted)]">
                    No users found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
