import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ClientServerCard from "./ClientServerCard";

export const dynamic = "force-dynamic";

export default async function AdminServersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const userId = typeof resolvedParams.userId === "string" ? resolvedParams.userId : undefined;

  const filter = userId ? { userId } : {};

  const servers = await prisma.server.findMany({
    where: filter,
    include: {
      user: {
        select: { email: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedServers = servers.map(s => ({
    ...s,
    memoryTotal: s.memoryTotal.toString(),
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          {userId ? "User's Servers" : "Global Servers"}
        </h1>
        {userId && (
          <Link href="/admin/users" className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Users
          </Link>
        )}
      </div>

      {userId && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--accent)]/10 text-[var(--text)] border border-[var(--accent)]/30 inline-flex items-center gap-2">
          Filtering servers by User ID: <code className="font-mono text-xs">{userId}</code>
          <Link href="/admin/servers" className="ml-4 text-sm text-[var(--accent)] hover:underline">Clear filter &times;</Link>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {formattedServers.map((server) => (
          <ClientServerCard key={server.id} server={server} />
        ))}
        {servers.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--text-muted)] bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
            {userId ? "This user has no recorded servers." : "No servers recorded on the platform yet."}
          </div>
        )}
      </div>
    </div>
  );
}
