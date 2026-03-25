"use client";
import { Shield } from "lucide-react";

function LogSection({ title, items, emptyMsg }: { title: string; items: any[]; emptyMsg: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <h3 className="font-semibold p-5 pb-3 border-b border-[var(--border)]">{title} <span className="text-xs text-[var(--text-muted)] ml-2">({items.length})</span></h3>
      {items.length === 0
        ? <div className="p-8 text-center text-sm text-[var(--text-muted)]">{emptyMsg}</div>
        : <div className="font-mono text-xs divide-y divide-[var(--border)] max-h-72 overflow-y-auto">
            {items.map((e: any, i) => (
              <div key={i} className="px-4 py-2 hover:bg-[var(--bg-card-hover)]">
                {e.time && <span className="text-[var(--text-muted)] mr-3">[{e.time}]</span>}
                {e.user && <span className="text-[var(--accent)] mr-2">{e.user}</span>}
                {e.command && <span className="text-[var(--text)]">{e.command}</span>}
                {e.message && <span>{e.message}</span>}
                {e.raw && <span className="text-[var(--text-muted)]">{e.raw}</span>}
              </div>
            ))}
          </div>
      }
    </div>
  );
}

export default function AuditTab({ data }: { data: any }) {
  if (!data) return <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-12 text-center text-[var(--text-muted)]">No audit data yet — waiting for the agent. Kernel messages work without root; auditd requires root.</div>;

  return (
    <div className="space-y-6">
      {!data.isRoot && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-4 text-sm text-[var(--danger)]">
          <Shield className="h-5 w-5 shrink-0" />
          <p>
            <strong>Elevated privileges required:</strong> The agent is not running as root. 
            Detailed auditd logs are unavailable. 
            Run the agent with <code className="bg-[var(--danger)]/10 px-1 rounded">sudo python3 linux_monitor_agent.py</code> to fix this.
          </p>
        </div>
      )}
      <LogSection title="Command Audit (auditd execve)" items={data.auditEvents || []} emptyMsg="No auditd events — requires auditd installed and agent running as root." />
      <LogSection title="Kernel Messages" items={data.kernelMsgs || []} emptyMsg="No kernel error messages." />
      <LogSection title="System Log Errors (journald/syslog)" items={data.syslogLines || []} emptyMsg="No syslog error entries." />
    </div>
  );
}
