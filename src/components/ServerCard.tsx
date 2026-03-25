"use client";

import Link from "next/link";
import { Server, Activity, Cpu, HardDrive, Wifi, Trash2, Layers, HelpCircle, GripVertical } from "lucide-react";

interface ServerCardProps {
  server: {
    id: string;
    name: string;
    hostname: string;
    ip: string | null;
    os: string | null;
    lastSeenAt: string;
    latestMetric: {
      cpuPercent: number;
      memoryPercent: number;
      diskPercent: number;
      loadAvg1: number;
      uptimeSeconds: number;
    } | null;
  };
  onDelete?: (id: string, name: string) => void;
  viewMode?: "grid" | "list";
  dragHandleProps?: any;
  isDragging?: boolean;
}

const METRIC_INFO = {
  cpu: "Total CPU usage across all cores. Displays current system load from applications/processes.",
  ram: "Memory actively used by the OS and running services. High usage may slow down the system.",
  disk: "Primary disk utilization (/). Monitor this to prevent space exhaustion on the root partition.",
  load: "1-minute load average. Represents the number of processes waiting for CPU time."
};

function MetricTooltip({ text }: { text: string }) {
  return (
    <div className="group/tooltip relative inline-flex items-center ml-1">
      <HelpCircle className="h-3 w-3 text-[var(--text-muted)] cursor-help hover:text-[var(--text)] transition-colors" />
      <div className="absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 scale-95 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2 text-[10px] leading-tight text-[var(--text)] opacity-0 shadow-xl transition-all group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100 z-50 pointer-events-none normal-case font-normal whitespace-normal break-words">
        {text}
        <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-[var(--border)]" />
      </div>
    </div>
  );
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatLastSeen(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function statusColor(lastSeen: string) {
  const d = new Date(lastSeen);
  const sec = (Date.now() - d.getTime()) / 1000;
  if (sec < 120) return "bg-[#3fb950]";
  if (sec < 600) return "bg-[#d29922]";
  return "bg-[#f85149]";
}

export function ServerCard({ server, onDelete, viewMode = "grid", dragHandleProps, isDragging }: ServerCardProps) {
  const m = server.latestMetric;
  const isOffline = !m || (new Date(server.lastSeenAt).getTime() < Date.now() - 120000);

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && confirm(`Delete server "${server.name}"? This will remove all metrics and process history.`)) {
      onDelete(server.id, server.name);
    }
  }

  if (viewMode === "list") {
    return (
      <div className={`group relative flex items-center gap-4 rounded-lg border transition-all duration-200 ${isDragging ? "border-dashed border-[var(--accent)] bg-[var(--accent)]/5 opacity-50 scale-[0.98] blur-[0.5px]" : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card-hover)]"} p-3`}>
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 text-[var(--text-muted)] hover:text-[var(--text)]">
          <GripVertical className="h-4 w-4" />
        </div>
        <Link href={`/dashboard/servers/${server.id}`} className="flex flex-1 items-center gap-4 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--bg-card-hover)] text-[var(--accent)]">
            <Server className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-sm text-[var(--text)]">{server.name}</h3>
            <p className="truncate text-xs text-[var(--text-muted)] font-mono">{server.hostname}</p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 w-24">
              <Cpu className="h-3 w-3 text-[#58a6ff]" />
              <div className="flex items-center">
                <span className="text-[10px] text-[var(--text-muted)] uppercase mr-1">CPU</span>
                <MetricTooltip text={METRIC_INFO.cpu} />
              </div>
              <span className="ml-auto font-semibold">{m ? `${m.cpuPercent.toFixed(0)}%` : "--"}</span>
            </div>
            <div className="flex items-center gap-1.5 w-24">
              <Layers className="h-3 w-3 text-[#a371f7]" />
              <div className="flex items-center">
                <span className="text-[10px] text-[var(--text-muted)] uppercase mr-1">RAM</span>
                <MetricTooltip text={METRIC_INFO.ram} />
              </div>
              <span className="ml-auto font-semibold">{m ? `${m.memoryPercent.toFixed(0)}%` : "--"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">Seen {formatLastSeen(server.lastSeenAt)}</span>
            <div className={`h-2 w-2 shrink-0 rounded-full ${statusColor(server.lastSeenAt)}`} />
          </div>
        </Link>
        {onDelete && (
          <button onClick={handleDeleteClick} className="p-1.5 text-[var(--text-muted)] hover:text(--danger)]">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`group relative rounded-lg border transition-all duration-200 ${isDragging ? "border-dashed border-[var(--accent)] bg-[var(--accent)]/5 opacity-40 scale-[0.98] rotate-1 shadow-inner blur-[0.5px]" : "border-[var(--border)] bg-[var(--bg-card)] p-5 hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card-hover)]"}`}>
      <div {...dragHandleProps} className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)]">
        <GripVertical className="h-5 w-5" />
      </div>
      <Link href={`/dashboard/servers/${server.id}`} className="block">
        <div className="flex items-start justify-between gap-4 pr-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card-hover)]">
              <Server className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-[var(--text)]">{server.name}</h3>
                <div className={`h-2 w-2 shrink-0 rounded-full ${statusColor(server.lastSeenAt)}`} />
              </div>
              <p className="truncate text-sm text-[var(--text-muted)] font-mono">
                {server.hostname} {server.ip && `• ${server.ip}`}
              </p>
            </div>
          </div>
        </div>

      {m ? (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="flex flex-col gap-1 rounded border border-[var(--border)] bg-[var(--bg)] p-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase">
              <div className="flex items-center gap-1">
                <Cpu className="h-3 w-3 text-[#58a6ff]" />
                CPU
              </div>
              <MetricTooltip text={METRIC_INFO.cpu} />
            </div>
            <span className="text-sm font-mono font-semibold">{m.cpuPercent.toFixed(0)}%</span>
          </div>
          <div className="flex flex-col gap-1 rounded border border-[var(--border)] bg-[var(--bg)] p-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase">
              <div className="flex items-center gap-1">
                <Layers className="h-3 w-3 text-[#a371f7]" />
                RAM
              </div>
              <MetricTooltip text={METRIC_INFO.ram} />
            </div>
            <span className="text-sm font-mono font-semibold">{m.memoryPercent.toFixed(0)}%</span>
          </div>
          <div className="flex flex-col gap-1 rounded border border-[var(--border)] bg-[var(--bg)] p-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase">
              <div className="flex items-center gap-1">
                <HardDrive className="h-3 w-3 text-[var(--accent)]" />
                DISK
              </div>
              <MetricTooltip text={METRIC_INFO.disk} />
            </div>
            <span className="text-sm font-mono font-semibold">{m.diskPercent.toFixed(0)}%</span>
          </div>
          <div className="flex flex-col gap-1 rounded border border-[var(--border)] bg-[var(--bg)] p-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase">
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-[#d29922]" />
                LOAD
              </div>
              <MetricTooltip text={METRIC_INFO.load} />
            </div>
            <span className="text-sm font-mono font-semibold">{m.loadAvg1.toFixed(1)}</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded border border-dashed border-[var(--border)] bg-[var(--bg)]/50 px-4 py-6 text-center text-sm text-[var(--text-muted)]">
          {isOffline ? "Waiting for first metrics..." : "No metrics yet"}
        </div>
      )}

        <div className="mt-4 flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase font-semibold">
          <span>{server.os || "Unknown OS"}</span>
          <span>Last seen {formatLastSeen(server.lastSeenAt)}</span>
        </div>
      </Link>
      {onDelete && (
        <button
          onClick={handleDeleteClick}
          title="Delete server"
          className="absolute right-3 top-3 rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--danger)]/20 hover:text-[var(--danger)]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
