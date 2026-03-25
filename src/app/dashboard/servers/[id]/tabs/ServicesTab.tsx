"use client";
function Badge({ text, type }: { text: string; type: "active" | "failed" | "inactive" | "neutral" }) {
  const cls = {
    active: "bg-[var(--accent)]/10 text-[var(--accent)]",
    failed: "bg-[var(--danger)]/10 text-[var(--danger)]",
    inactive: "bg-[var(--text-muted)]/10 text-[var(--text-muted)]",
    neutral: "bg-purple-500/10 text-purple-500",
  }[type];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{text}</span>;
}

function Section({ title, children, empty }: { title: string; children?: React.ReactNode; empty?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <h3 className="font-semibold p-5 pb-3 border-b border-[var(--border)]">{title}</h3>
      {empty ? <div className="p-8 text-center text-[var(--text-muted)] text-sm">No data available</div> : children}
    </div>
  );
}

export default function ServicesTab({ data }: { data: any }) {
  if (!data) return <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-12 text-center text-[var(--text-muted)]">No service data yet — waiting for the agent.</div>;

  const { services = [], ports = [], cronJobs = [] } = data;
  const failed = services.filter((s: any) => s.activeState === "failed");

  return (
    <div className="space-y-6">
      {failed.length > 0 && (
        <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/5 p-4">
          <p className="text-sm font-semibold text-[var(--danger)] mb-2">⚠ {failed.length} Failed Service{failed.length !== 1 ? "s" : ""}</p>
          {failed.map((s: any, i: number) => <p key={`${s.name}-${i}`} className="font-mono text-sm">{s.name}</p>)}
        </div>
      )}

      {/* Systemd Services */}
      <Section title={`Systemd Services (${services.length})`} empty={services.length === 0}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--bg)]/50 text-[var(--text-muted)] border-b border-[var(--border)]">
              <tr>{["Service", "Load", "Active", "Sub"].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {services.slice(0, 100).map((s: any, i: number) => (
                <tr key={`${s.name}-${i}`} className="hover:bg-[var(--bg-card-hover)]">
                  <td className="px-4 py-2 font-mono text-xs max-w-[200px] truncate">{s.name}</td>
                  <td className="px-4 py-2"><Badge text={s.loadState} type={s.loadState === "loaded" ? "neutral" : "inactive"} /></td>
                  <td className="px-4 py-2"><Badge text={s.activeState} type={s.activeState === "active" ? "active" : s.activeState === "failed" ? "failed" : "inactive"} /></td>
                  <td className="px-4 py-2 text-xs text-[var(--text-muted)]">{s.subState}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Open Ports */}
      <Section title={`Open Ports (${ports.length})`} empty={ports.length === 0}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--bg)]/50 text-[var(--text-muted)] border-b border-[var(--border)]">
              <tr>{["Port", "Proto", "State", "PID", "Process"].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {ports.map((p: any, i: number) => (
                <tr key={i} className="hover:bg-[var(--bg-card-hover)]">
                  <td className="px-4 py-2 font-mono font-bold">{p.port}</td>
                  <td className="px-4 py-2"><Badge text={p.proto.toUpperCase()} type="neutral" /></td>
                  <td className="px-4 py-2 text-xs text-[var(--text-muted)]">{p.state}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.pid || "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.process || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Cron Jobs */}
      <Section title={`Cron Jobs (${cronJobs.length})`} empty={cronJobs.length === 0}>
        <div className="divide-y divide-[var(--border)]">
          {cronJobs.slice(0, 50).map((c: any, i: number) => (
            <div key={i} className="px-4 py-3 hover:bg-[var(--bg-card-hover)]">
              <span className="text-xs text-[var(--text-muted)] mr-3">[{c.source}]</span>
              <span className="font-mono text-xs text-[var(--text)]">{c.entry}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
