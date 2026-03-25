"use client";
function formatBytes(b: number) {
  const gb = b / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(b / 1024 ** 2).toFixed(0)} MB`;
}

function ProgressBar({ pct, color = "var(--accent)" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-[var(--bg)] mt-1">
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
    </div>
  );
}

function Empty() {
  return <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-12 text-center text-[var(--text-muted)]">No data yet — waiting for the agent to push OS health data.</div>;
}

export default function OsHealthTab({ server, latestMetric: m }: any) {
  if (!m) return <Empty />;

  const diskMounts = (() => { try { return JSON.parse(m.diskMounts || "[]"); } catch { return []; } })();
  const nics = (() => { try { return JSON.parse(m.networkInterfaces || "[]"); } catch { return []; } })();
  const perCore = (() => { try { return JSON.parse(m.cpuPerCore || "[]"); } catch { return []; } })();

  return (
    <div className="space-y-6">
      {/* CPU detail */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <h3 className="font-semibold mb-4">CPU — Per Core</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[["Total", `${m.cpuPercent?.toFixed(1)}%`], ["I/O Wait", `${m.cpuIowait?.toFixed(1) ?? 0}%`], ["Steal", `${m.cpuSteal?.toFixed(1) ?? 0}%`], ["Cores", server.cpuCores]].map(([k, v]) => (
            <div key={k} className="bg-[var(--bg)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--text-muted)]">{k}</p>
              <p className="font-mono font-bold text-lg">{v}</p>
            </div>
          ))}
        </div>
        {perCore.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {perCore.map((pct: number, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>Core {i}</span><span className="font-mono">{pct.toFixed(1)}%</span></div>
                <ProgressBar pct={pct} color={pct > 90 ? "var(--danger)" : pct > 70 ? "#d29922" : "var(--accent)"} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Memory detail */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <h3 className="font-semibold mb-4">Memory Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["Used", formatBytes(Number(m.memoryUsed))],
            ["Cached", formatBytes(Number(m.memCached ?? 0))],
            ["Buffers", formatBytes(Number(m.memBuffers ?? 0))],
            ["Swap Used", formatBytes(Number(m.swapUsed))],
          ].map(([k, v]) => (
            <div key={k} className="bg-[var(--bg)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--text-muted)]">{k}</p>
              <p className="font-mono font-bold">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1"><span>RAM</span><span>{m.memoryPercent?.toFixed(1)}%</span></div>
          <ProgressBar pct={m.memoryPercent} color={m.memoryPercent > 90 ? "var(--danger)" : m.memoryPercent > 75 ? "#d29922" : "var(--accent)"} />
          <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1 mt-2"><span>Swap</span><span>{m.swapPercent?.toFixed(1)}%</span></div>
          <ProgressBar pct={m.swapPercent} color={m.swapPercent > 50 ? "var(--danger)" : "#d29922"} />
        </div>
      </div>

      {/* Disk mount points */}
      {diskMounts.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h3 className="font-semibold mb-4">Disk — Mount Points</h3>
          <div className="space-y-3">
            {diskMounts.map((d: any) => (
              <div key={d.mount}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-mono font-medium">{d.mount}</span>
                  <span className="text-[var(--text-muted)]">{formatBytes(d.used)} / {formatBytes(d.total)} · {d.percent?.toFixed(1)}%
                    {d.inodesTotal > 0 && <span className="ml-2 text-xs">inodes: {((d.inodesUsed / d.inodesTotal) * 100).toFixed(0)}%</span>}
                  </span>
                </div>
                <ProgressBar pct={d.percent} color={d.percent > 90 ? "var(--danger)" : d.percent > 75 ? "#d29922" : "var(--accent)"} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network interfaces */}
      {nics.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <h3 className="font-semibold p-5 pb-3">Network Interfaces</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--bg)]/50 text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  {["Interface", "Status", "RX", "TX", "Pkt RX", "Pkt TX", "Err", "Drop"].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {nics.filter((n: any) => n.name !== "lo").map((nic: any) => (
                  <tr key={nic.name} className="hover:bg-[var(--bg-card-hover)]">
                    <td className="px-4 py-3 font-mono font-medium">{nic.name}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${nic.isUp ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-[var(--danger)]/10 text-[var(--danger)]'}`}>{nic.isUp ? "UP" : "DOWN"}</span></td>
                    <td className="px-4 py-3 font-mono text-xs">{formatBytes(nic.bytesRecv)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{formatBytes(nic.bytesSent)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{nic.packetsRecv?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs">{nic.packetsSent?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--danger)]">{(nic.errin + nic.errout)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#d29922]">{(nic.dropin + nic.dropout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
