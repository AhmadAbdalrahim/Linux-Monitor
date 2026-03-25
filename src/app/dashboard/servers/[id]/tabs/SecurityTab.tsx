"use client";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

function Section({ title, children, empty }: { title: string; children?: React.ReactNode; empty?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <h3 className="font-semibold p-5 pb-3 border-b border-[var(--border)]">{title}</h3>
      {empty ? <div className="p-8 text-center text-sm text-[var(--text-muted)]">No data — requires root or tool not installed.</div> : children}
    </div>
  );
}

export default function SecurityTab({ data }: { data: any }) {
  if (!data) return <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-12 text-center text-[var(--text-muted)]">No security data yet — requires the agent running as root.</div>;

  const { isRoot = true, fimEvents = [], firewallRules = [], selinuxEvents = [], appArmorEvents = [] } = data;

  return (
    <div className="space-y-6">
      {!isRoot && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-4 text-sm text-[var(--danger)]">
          <Shield className="h-5 w-5 shrink-0" />
          <p>
            <strong>Elevated privileges required:</strong> The agent is not running as root. 
            Detailed security monitoring (FIM, SELinux, AppArmor) is unavailable. 
            Run the agent with <code className="bg-[var(--danger)]/10 px-1 rounded">sudo python3 linux_monitor_agent.py</code> to fix this.
          </p>
        </div>
      )}
      {/* FIM */}
      <Section title="File Integrity Monitor">
        {fimEvents.length === 0 ? (
          <div className="flex items-center gap-3 p-6 text-[var(--accent)]">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-medium">All monitored files are unchanged.</span>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {fimEvents.map((e: any, i: number) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-[var(--bg-card-hover)]">
                <ShieldAlert className="h-4 w-4 text-[var(--danger)] mt-0.5 shrink-0" />
                <div>
                  <p className="font-mono text-sm font-medium text-[var(--danger)]">{e.file}</p>
                  <p className="text-xs text-[var(--text-muted)]">{e.changeType} at {e.time} · size {e.oldSize}→{e.newSize} bytes</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Firewall */}
      <Section title="Firewall Rules" empty={firewallRules.length === 0}>
        {firewallRules.map((r: any, i: number) => (
          <div key={i} className="p-4 border-b border-[var(--border)] last:border-0">
            <p className="text-xs font-bold text-[var(--text-muted)] mb-2">[{r.tool}]</p>
            <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap text-[var(--text)]">{r.output}</pre>
          </div>
        ))}
      </Section>

      {/* SELinux */}
      <Section title={`SELinux AVC Denials (${selinuxEvents.length})`} empty={selinuxEvents.length === 0 && !data}>
        {selinuxEvents.length === 0
          ? <div className="p-8 text-center text-sm text-[var(--accent)]">No SELinux denials detected.</div>
          : <div className="font-mono text-xs divide-y divide-[var(--border)] max-h-64 overflow-y-auto">
              {selinuxEvents.map((e: any, i: number) => <div key={i} className="px-4 py-2 hover:bg-[var(--bg-card-hover)] text-[var(--danger)]">{e.raw}</div>)}
            </div>
        }
      </Section>

      {/* AppArmor */}
      <Section title={`AppArmor Denials (${appArmorEvents.length})`} empty={appArmorEvents.length === 0 && !data}>
        {appArmorEvents.length === 0
          ? <div className="p-8 text-center text-sm text-[var(--accent)]">No AppArmor denials detected.</div>
          : <div className="font-mono text-xs divide-y divide-[var(--border)] max-h-64 overflow-y-auto">
              {appArmorEvents.map((e: any, i: number) => <div key={i} className="px-4 py-2 hover:bg-[var(--bg-card-hover)] text-[var(--danger)]">{e.raw}</div>)}
            </div>
        }
      </Section>
    </div>
  );
}
