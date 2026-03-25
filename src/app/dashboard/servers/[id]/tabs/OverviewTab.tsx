"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Cpu, Activity, HardDrive, Wifi } from "lucide-react";

function StatCard({ icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">{icon}<span className="text-sm">{label}</span></div>
      <p className="font-mono text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  );
}

function Chart({ title, data, dataKey, color, unit = "%" }: any) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="time" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px" }}
              formatter={(v: any) => [`${Number(v).toFixed(1)}${unit}`, title]} />
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatBytes(b: number) {
  const gb = b / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(b / 1024 ** 2).toFixed(0)} MB`;
}
function formatUptime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function OverviewTab({ server, latestMetric: m, metrics }: any) {
  return (
    <div className="space-y-6">
      {m ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<Cpu className="h-4 w-4" />} label="CPU" value={`${m.cpuPercent?.toFixed(1)}%`} sub={`iowait: ${m.cpuIowait?.toFixed(1) ?? 0}% steal: ${m.cpuSteal?.toFixed(1) ?? 0}%`} />
          <StatCard icon={<Activity className="h-4 w-4" />} label="Memory" value={`${m.memoryPercent?.toFixed(1)}%`} sub={`${formatBytes(Number(m.memoryUsed))} / ${formatBytes(Number(m.memoryTotal))}`} />
          <StatCard icon={<HardDrive className="h-4 w-4" />} label="Disk" value={`${m.diskPercent?.toFixed(1)}%`} sub={`${formatBytes(Number(m.diskUsed))} / ${formatBytes(Number(m.diskTotal))}`} />
          <StatCard icon={<Wifi className="h-4 w-4" />} label="Uptime" value={formatUptime(m.uptimeSeconds)} sub={`${m.processCount} procs · ${m.zombieCount ?? 0} zombies`} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-12 text-center text-[var(--text-muted)]">No metrics yet — waiting for the agent.</div>
      )}

      {/* Load average bar */}
      {m && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h3 className="font-semibold mb-3">Load Average <span className="text-xs text-[var(--text-muted)] ml-2">({server.cpuCores} cores)</span></h3>
          <div className="grid grid-cols-3 gap-4">
            {[["1m", m.loadAvg1], ["5m", m.loadAvg5], ["15m", m.loadAvg15]].map(([label, val]) => {
              const pct = Math.min(100, (Number(val) / (server.cpuCores || 1)) * 100);
              const color = pct > 100 ? "var(--danger)" : pct > 70 ? "#d29922" : "var(--accent)";
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-[var(--text-muted)]">{label}</span><span className="font-mono font-bold" style={{color}}>{Number(val).toFixed(2)}</span></div>
                  <div className="h-2 rounded-full bg-[var(--bg)]"><div className="h-2 rounded-full transition-all" style={{width:`${pct}%`, backgroundColor: color}}></div></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {metrics.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Chart title="CPU Usage" data={metrics} dataKey="cpuPercent" color="#58a6ff" />
          <Chart title="Memory Usage" data={metrics} dataKey="memoryPercent" color="#a371f7" />
          <Chart title="Disk Usage" data={metrics} dataKey="diskPercent" color="#d29922" />
          <Chart title="Swap Usage" data={metrics} dataKey="swapPercent" color="#f85149" />
        </div>
      )}
    </div>
  );
}
