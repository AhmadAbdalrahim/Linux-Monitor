import Link from "next/link";
import { Terminal, Shield, Activity, BarChart3, Database, Globe } from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";
import { getSession } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { LogoutNotifier } from "@/components/LogoutNotifier";
import { Logo } from "@/components/Logo";

export default async function LandingPage() {
  const session = await getSession();
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <LogoutNotifier />
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur z-50 sticky top-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <div className="flex items-center gap-4">
            <ThemeSelector />
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium hover:text-[var(--accent)] transition-colors">
                  Dashboard
                </Link>
                <div className="flex h-7 w-7 items-center justify-center bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-xs font-bold uppercase shrink-0">
                  {session.user.name ? session.user.name[0] : session.user.email[0]}
                </div>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-[var(--accent)] transition-colors">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-[var(--text)] text-[var(--bg)] px-4 py-2 text-sm font-medium transition-transform hover:scale-105"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden pt-24 pb-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--accent)_0%,transparent_30%)] opacity-10 pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 mt-8 p-2 bg-gradient-to-r from-[var(--text)] to-[var(--text-muted)] bg-clip-text text-transparent transform transition-all">
              Monitor Everything. <br className="hidden md:block"/> Missing Nothing.
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-[var(--text-muted)] mb-10">
              The simplest, most beautiful way to track CPU, Memory, Disk, and Processes on your remote Linux servers. Install the single-command agent and watch your metrics roll in.
            </p>
            <div className="flex items-center justify-center gap-4 flex-col sm:flex-row mt-6">
              {session ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto rounded-xl bg-[var(--accent)] px-8 py-4 text-white font-bold text-lg shadow-[0_0_40px_var(--accent)] shadow-[var(--accent)]/40 transition-all hover:scale-105 hover:shadow-[var(--accent)]/60"
                >
                  Return to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="w-full sm:w-auto rounded-xl bg-[var(--accent)] px-8 py-4 text-white font-bold text-lg shadow-[0_0_40px_var(--accent)] shadow-[var(--accent)]/40 transition-all hover:scale-105 hover:shadow-[var(--accent)]/60"
                  >
                    Start Monitoring Free
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-8 py-4 font-bold text-lg transition-all hover:bg-[var(--bg-card-hover)]"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
            
            <div className="mt-20 mx-auto max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/50 backdrop-blur p-2 shadow-2xl relative">
              <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000" alt="Dashboard Preview" className="rounded-xl border border-[var(--border)] opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700" />
            </div>
          </div>
        </section>

        <section className="py-24 bg-[var(--bg-card)] border-y border-[var(--border)]">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold text-center mb-16">Everything you need to keep your stack running</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Activity className="h-6 w-6 text-[#a371f7]" />, title: "Real-time Metrics", desc: "Watch CPU, Memory, and Disk usage update live." },
                { icon: <Shield className="h-6 w-6 text-[var(--accent)]" />, title: "Secure by Design", desc: "Each server generates a unique secure token key. Data is completely isolated." },
                { icon: <Terminal className="h-6 w-6 text-[#58a6ff]" />, title: "1-Minute Setup", desc: "Run a single python command on your server to start pushing data instantly." },
                { icon: <Database className="h-6 w-6 text-[#d29922]" />, title: "Historical Data", desc: "Look back up to 7 days of historical metric data smoothly rendered." },
                { icon: <BarChart3 className="h-6 w-6 text-[#f85149]" />, title: "Process Inspection", desc: "Deep dive into running processes, memory RSS, and CPU per process." },
                { icon: <Globe className="h-6 w-6 text-[#e6edf3]" />, title: "Anywhere Access", desc: "Access your dashboard from desktop, tablet, or phone natively." },
              ].map((feature, i) => (
                <div key={i} className="group p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)]/50 transition-colors">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-card)] group-hover:bg-[var(--bg)] transition-colors border border-[var(--border)]">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-8 mt-auto">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
          <p className="text-sm text-[var(--text-muted)]">© 2026 Linux Monitor SaaS. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
