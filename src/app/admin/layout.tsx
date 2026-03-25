import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Users, Server, Activity, ArrowLeft } from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";
import { UserProfile } from "@/components/UserProfile";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Explicit un-typed check since Prisma generate is pending
  const user = session?.user as any;

  if (!session || !user || !user.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)]">
      <aside className="w-64 border-r border-[var(--border)] bg-[var(--bg-card)] flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-[var(--border)] gap-2">
          <Activity className="h-5 w-5 text-[var(--danger)]" />
          <span className="font-bold tracking-wide">Admin control</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-[var(--bg-card-hover)] transition-colors">
            <Activity className="h-4 w-4" /> Overview
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-[var(--bg-card-hover)] transition-colors">
            <Users className="h-4 w-4" /> All Users
          </Link>
          <Link href="/admin/servers" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-[var(--bg-card-hover)] transition-colors">
            <Server className="h-4 w-4" /> All Servers
          </Link>
        </nav>
        <div className="p-4 border-t border-[var(--border)]">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to App
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur flex items-center justify-end px-6 sticky top-0 md:justify-between">
          <div className="md:hidden font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--danger)]" /> Admin
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <UserProfile hideAdminLink={true} />
            <SignOutButton />
            <ThemeSelector />
          </div>
        </header>
        <div className="p-6 md:p-8 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
