import { prisma } from "@/lib/prisma";
import { Users, Server, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const usersCount = await prisma.user.count();
  const serversCount = await prisma.server.count();
  const metricsCount = await prisma.metric.count();

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Platform Overview</h1>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-[var(--text-muted)]">Total Users</h3>
          </div>
          <p className="text-4xl font-bold">{usersCount}</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Server className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-[var(--text-muted)]">Total Servers</h3>
          </div>
          <p className="text-4xl font-bold">{serversCount}</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-[var(--text-muted)]">Data Points</h3>
          </div>
          <p className="text-4xl font-bold">{metricsCount}</p>
        </div>
      </div>
    </div>
  );
}
