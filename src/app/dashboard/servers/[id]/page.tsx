"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Server, Trash2, Pencil, RefreshCw, Cpu, Activity, HardDrive, Wifi, Shield, Terminal, Users, Download } from "lucide-react";
import { toast } from "@/lib/toast";
import { ThemeSelector } from "@/components/ThemeSelector";
import { UserProfile } from "@/components/UserProfile";
import { SignOutButton } from "@/components/SignOutButton";
import OverviewTab from "./tabs/OverviewTab";
import OsHealthTab from "./tabs/OsHealthTab";
import ServicesTab from "./tabs/ServicesTab";
import UserActivityTab from "./tabs/UserActivityTab";
import AuditTab from "./tabs/AuditTab";
import SecurityTab from "./tabs/SecurityTab";
import { Logo } from "@/components/Logo";

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "oshealth", label: "OS Health", icon: Cpu },
  { id: "services", label: "Services", icon: HardDrive },
  { id: "useractivity", label: "User Activity", icon: Users },
  { id: "audit", label: "Audit Log", icon: Terminal },
  { id: "security", label: "Security", icon: Shield },
] as const;

type TabId = (typeof TABS)[number]["id"];

function formatTime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const TIME_RANGES = { "1h": 60, "6h": 360, "24h": 1440, "7d": 10080 } as const;

export default function ServerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tab, setTab] = useState<TabId>("overview");
  const [server, setServer] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [latestMetric, setLatestMetric] = useState<any>(null);
  const [servicesData, setServicesData] = useState<any>(null);
  const [userActivityData, setUserActivityData] = useState<any>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<keyof typeof TIME_RANGES>("24h");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const fetchServer = useCallback(async () => {
    const res = await fetch(`/api/servers/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setServer(data);
    setPendingName(data.name);
    setLatestMetric(data.latestMetric);
  }, [id]);

  const fetchMetrics = useCallback(async () => {
    const mins = TIME_RANGES[timeRange];
    const from = new Date(Date.now() - mins * 60 * 1000).toISOString();
    const res = await fetch(`/api/servers/${id}/metrics?from=${from}`);
    if (!res.ok) return;
    const data = await res.json();
    setMetrics(
      data.map((m: any) => ({
        ...m,
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }))
    );
  }, [id, timeRange]);

  const fetchTabData = useCallback(async () => {
    const [svc, act, aud, sec] = await Promise.allSettled([
      fetch(`/api/servers/${id}/services`).then(r => r.ok ? r.json() : null),
      fetch(`/api/servers/${id}/user-activity`).then(r => r.ok ? r.json() : null),
      fetch(`/api/servers/${id}/audit`).then(r => r.ok ? r.json() : null),
      fetch(`/api/servers/${id}/security`).then(r => r.ok ? r.json() : null),
    ]);
    setServicesData(svc.status === "fulfilled" ? svc.value : null);
    setUserActivityData(act.status === "fulfilled" ? act.value : null);
    setAuditData(aud.status === "fulfilled" ? aud.value : null);
    setSecurityData(sec.status === "fulfilled" ? sec.value : null);
  }, [id]);

  const loadAll = useCallback(async () => {
    await Promise.all([fetchServer(), fetchMetrics(), fetchTabData()]);
  }, [fetchServer, fetchMetrics, fetchTabData]);

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  useEffect(() => {
    const interval = setInterval(() => loadAll(), 30_000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingName.trim()) return;
    const res = await fetch(`/api/servers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: pendingName }),
    });
    if (res.ok) {
      const d = await res.json();
      setServer((s: any) => s ? { ...s, name: d.name } : s);
    }
    setEditingName(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete server "${server?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/servers/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`Server "${server.name}" deleted`);
      router.push("/dashboard");
    } else {
      setDeleting(false);
      toast.error("Failed to delete server");
    }
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    setShowExportMenu(false);
    toast.info(`Preparing ${format.toUpperCase()} export...`);
    try {
      const res = await fetch(`/api/servers/${id}/export?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const ext = format === "xlsx" ? "xlsx" : "csv";
        a.download = `metrics-${server.name}-${new Date().toISOString().split("T")[0]}.${ext}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`${format.toUpperCase()} downloaded successfully`);
      } else {
        toast.error("Failed to generate export");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred during export");
    }
  };

  const isOnline = server?.lastSeenAt && (Date.now() - new Date(server.lastSeenAt).getTime()) < 5 * 60 * 1000;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[var(--accent)] border-t-transparent mb-4" />
          <p className="text-[var(--text-muted)]">Loading server data…</p>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="text-center"><p className="text-2xl font-bold mb-2">Server Not Found</p><Link href="/dashboard" className="text-[var(--accent)] hover:underline">Back to Dashboard</Link></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo showText={false} className="hidden sm:flex" />
            <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />
            <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10">
              <Server className="h-4 w-4 text-[var(--accent)]" />
            </div>
            {editingName ? (
              <form onSubmit={handleRename} className="flex items-center gap-2">
                <input autoFocus value={pendingName} onChange={e => setPendingName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Escape") { setPendingName(server.name); setEditingName(false); } }}
                  className="text-base font-bold bg-transparent border-b-2 border-[var(--accent)] focus:outline-none w-40" />
                <button type="submit" className="text-xs px-2 py-1 rounded bg-[var(--accent)] text-white">Save</button>
                <button type="button" onClick={() => { setPendingName(server.name); setEditingName(false); }} className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--text-muted)]">✕</button>
              </form>
            ) : (
              <button onClick={() => { setPendingName(server.name); setEditingName(true); }} className="group flex items-center gap-1.5 min-w-0" title="Click to rename">
                <span className="font-bold text-base truncate group-hover:text-[var(--accent)] transition-colors">{server.name}</span>
                <Pencil className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 shrink-0" />
              </button>
            )}
            <span className={`hidden sm:inline-flex h-2 w-2 rounded-full shrink-0 ${isOnline ? "bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]" : "bg-[var(--danger)]"}`} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing} className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card)] transition-colors" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <select value={timeRange} onChange={e => setTimeRange(e.target.value as any)}
              className="hidden sm:block text-xs bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none">
              {Object.keys(TIME_RANGES).map(r => <option key={r} value={r}>Last {r}</option>)}
            </select>
            <button onClick={handleDelete} disabled={deleting} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-md transition-colors" title="Delete server">
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)} 
                className={`p-1.5 rounded-md transition-colors ${showExportMenu ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10"}`} 
                title="Export report"
              >
                <Download className="h-4 w-4" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  <button onClick={() => handleExport("xlsx")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--bg)] transition-colors">
                    <HardDrive className="h-4 w-4 text-[var(--accent)]" />
                    <span>Download XLSX (Full)</span>
                  </button>
                  <button onClick={() => handleExport("csv")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--bg)] transition-colors">
                    <Activity className="h-4 w-4 text-[var(--accent)]" />
                    <span>Download CSV</span>
                  </button>
                </div>
              )}
            </div>
            <ThemeSelector />
            <UserProfile />
            <SignOutButton />
          </div>
        </div>
        {/* Tab Nav */}
        <div className="flex overflow-x-auto border-t border-[var(--border)] bg-[var(--bg-card)]/30 scrollbar-none">
          {TABS.map(({ id: tid, label, icon: Icon }) => (
            <button key={tid} onClick={() => setTab(tid)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === tid ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Server info bar */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-card)]/50 px-4 sm:px-6 py-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--text-muted)]">
        <span className="font-mono">{server.hostname}</span>
        {server.ip && <span className="font-mono">{server.ip}</span>}
        <span>{server.os}</span>
        {server.cpuModel && <span>{server.cpuModel} · {server.cpuCores} cores</span>}
        {latestMetric && <span>Uptime: {formatTime(latestMetric.uptimeSeconds)}</span>}
        <span className={`ml-auto font-medium ${isOnline ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>{isOnline ? "● Online" : "● Offline"}</span>
      </div>

      {/* Tab content */}
      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {tab === "overview" && <OverviewTab server={server} latestMetric={latestMetric} metrics={metrics} />}
        {tab === "oshealth" && <OsHealthTab server={server} latestMetric={latestMetric} />}
        {tab === "services" && <ServicesTab data={servicesData} />}
        {tab === "useractivity" && <UserActivityTab data={userActivityData} />}
        {tab === "audit" && <AuditTab data={auditData} />}
        {tab === "security" && <SecurityTab data={securityData} />}
      </main>
    </div>
  );
}
