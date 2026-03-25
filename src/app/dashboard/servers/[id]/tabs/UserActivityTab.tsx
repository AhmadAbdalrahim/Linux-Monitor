"use client";
import { Shield, Users, Clock, History, Cpu } from "lucide-react";

function Table({ headers, rows, emptyMsg }: { headers: string[]; rows: any[][]; emptyMsg: string }) {
  if (rows.length === 0) return <div className="p-8 text-center text-sm text-[var(--text-muted)]">{emptyMsg}</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--bg-card-hover)] text-[var(--text-muted)] uppercase text-[10px] font-bold">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-[var(--bg-card-hover)]/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-[var(--text)] whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center gap-2 p-5 pb-3 border-b border-[var(--border)]">
        <Icon className="h-4 w-4 text-[var(--accent)]" />
        <h3 className="font-semibold text-[var(--text)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function UserActivityTab({ data }: { data: any }) {
  if (!data) return <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-12 text-center text-[var(--text-muted)]">No user activity data yet — waiting for the agent.</div>;

  const { isRoot = true, activeSessions = [], loginHistory = [], sudoEvents = [], sshEvents = [] } = data;

  return (
    <div className="space-y-6">
      {!isRoot && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-4 text-sm text-[var(--danger)]">
          <Shield className="h-5 w-5 shrink-0" />
          <p>
            <strong>Elevated privileges required:</strong> The agent is not running as root. 
            Detailed logs (sudo/ssh events) are unavailable. 
            Run the agent with <code className="bg-[var(--danger)]/10 px-1 rounded">sudo python3 linux_monitor_agent.py</code> to fix this.
          </p>
        </div>
      )}
      
      {/* Active Sessions */}
      <Section title={`Active Sessions (${activeSessions.length} online)`} icon={Users}>
        <Table 
          headers={["User", "TTY", "From", "Login At", "Idle"]}
          rows={activeSessions.map((s: any) => [s.user, s.tty, s.from || "-", s.loginAt, s.idle])}
          emptyMsg="No active sessions detected."
        />
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sudo Events */}
        <Section title="Recent Sudo Executions" icon={Shield}>
          <Table 
            headers={["Time", "User", "Command"]}
            rows={sudoEvents.map((e: any) => [e.time, e.user, e.command])}
            emptyMsg="No recent sudo events."
          />
        </Section>

        {/* SSH Events */}
        <Section title="Recent SSH Logins" icon={Clock}>
          <Table 
            headers={["Time", "User", "Source IP"]}
            rows={sshEvents.map((e: any) => [e.time, e.user, e.ip])}
            emptyMsg="No recent SSH logins."
          />
        </Section>
      </div>

      {/* Login History */}
      <Section title="General Login History" icon={History}>
        <Table 
          headers={["User", "TTY", "From", "Date", "Status"]}
          rows={loginHistory.map((h: any) => [h.user, h.tty, h.from || "-", h.date, h.status])}
          emptyMsg="No login history found."
        />
      </Section>
    </div>
  );
}
