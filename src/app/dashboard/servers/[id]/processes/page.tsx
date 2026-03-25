"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Server, Search, RefreshCw, Clock } from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";
import { UserProfile } from "@/components/UserProfile";

interface Process {
  pid: number;
  ppid: number;
  name: string;
  status: string;
  username: string;
  cpuPercent: number;
  memoryPercent: number;
  memoryRss: number;
  createTime: number;
  cmdline: string;
  exe: string;
}

interface ServerData {
  id: string;
  name: string;
  hostname: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = bytes / (1024 ** 2);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
}

function formatTime(ts: number) {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

export default function ProcessesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [server, setServer] = useState<ServerData | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"cpu" | "memory" | "pid" | "name">("cpu");
  const [id, setId] = useState<string | null>(null);
  const [viewAt, setViewAt] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  async function fetchData() {
    if (!id) return;
    try {
      let processUrl = `/api/servers/${id}/processes`;
      if (viewAt) {
        processUrl += `?at=${encodeURIComponent(new Date(viewAt).toISOString())}`;
      }
      const [sRes, pRes] = await Promise.all([
        fetch(`/api/servers/${id}`),
        fetch(processUrl),
      ]);
      if (sRes.ok) {
        const s = await sRes.json();
        setServer({ id: s.id, name: s.name, hostname: s.hostname });
      }
      if (pRes.ok) {
        const data = await pRes.json();
        setProcesses(data.processes || []);
        setTimestamp(data.timestamp);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    if (!viewAt) {
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [id, viewAt]);

  const filtered = processes.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.username.toLowerCase().includes(search.toLowerCase()) ||
      p.cmdline.toLowerCase().includes(search.toLowerCase()) ||
      String(p.pid).includes(search)
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "cpu") return b.cpuPercent - a.cpuPercent;
    if (sortBy === "memory") return b.memoryPercent - a.memoryPercent;
    if (sortBy === "pid") return a.pid - b.pid;
    return a.name.localeCompare(b.name);
  });

  if (loading || !server) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/servers/${id}`}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Server
          </Link>
          <div className="flex items-center gap-4">
            <UserProfile />
            <ThemeSelector />
          </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-card)]">
              <Server className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)]">Running Processes</h1>
              <p className="text-sm text-[var(--text-muted)]">
                {server.name} • {processes.length} processes
                {timestamp && (
                  <> • Last updated {new Date(timestamp).toLocaleString()}</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg-card-hover)]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Historical view: pick a specific date/time */}
        <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Clock className="h-4 w-4" />
              <span>View processes at specific time:</span>
            </div>
            <input
              type="datetime-local"
              value={viewAt || ""}
              onChange={(e) => setViewAt(e.target.value || null)}
              className="rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
            {viewAt && (
              <button
                onClick={() => setViewAt(null)}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--bg-card-hover)]"
              >
                Show latest
              </button>
            )}
          </div>
          {viewAt && timestamp && (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Showing snapshot from {new Date(timestamp).toLocaleString()}
              {Math.abs(new Date(timestamp).getTime() - new Date(viewAt).getTime()) > 60000 &&
                " (closest available)"}
            </p>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by name, PID, user, command..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2 pl-10 pr-4 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "cpu" | "memory" | "pid" | "name")
            }
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="cpu">Sort by CPU</option>
            <option value="memory">Sort by Memory</option>
            <option value="pid">Sort by PID</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {processes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-16 text-center">
            <p className="text-[var(--text-muted)]">
              No process data yet. The agent sends process details every 60 seconds.
            </p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Restart the agent on the Linux server to start receiving process data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-sm text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">PID</th>
                  <th className="px-4 py-3 font-medium">PPID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">CPU %</th>
                  <th className="px-4 py-3 font-medium text-right">Mem %</th>
                  <th className="px-4 py-3 font-medium text-right">RSS</th>
                  <th className="px-4 py-3 font-medium">Started</th>
                  <th className="px-4 py-3 font-medium">Command</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => (
                  <tr
                    key={p.pid}
                    className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-card-hover)]/50"
                  >
                    <td className="px-4 py-2 font-mono text-sm">{p.pid}</td>
                    <td className="px-4 py-2 font-mono text-sm text-[var(--text-muted)]">
                      {p.ppid}
                    </td>
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2 text-sm text-[var(--text-muted)]">
                      {p.username}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          p.status === "running"
                            ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                            : p.status === "sleeping"
                              ? "bg-[#58a6ff]/20 text-[#58a6ff]"
                              : "bg-[var(--border)] text-[var(--text-muted)]"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm">
                      {p.cpuPercent.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm">
                      {p.memoryPercent.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-[var(--text-muted)]">
                      {formatBytes(p.memoryRss)}
                    </td>
                    <td className="px-4 py-2 text-xs text-[var(--text-muted)]">
                      {formatTime(p.createTime)}
                    </td>
                    <td className="max-w-[300px] truncate px-4 py-2 font-mono text-xs text-[var(--text-muted)]" title={p.cmdline}>
                      {p.cmdline || p.exe || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {processes.length > 0 && (
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Showing {sorted.length} of {processes.length} processes
            {search && ` (filtered by "${search}")`}
          </p>
        )}
      </main>
    </div>
  );
}
