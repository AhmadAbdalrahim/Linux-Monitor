import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "csv";

  try {
    const p = prisma as any;
    // 1. Fetch all relevant data
    const [server, metrics, services, activity, audit, security] = await Promise.all([
      prisma.server.findUnique({ where: { id } }),
      prisma.metric.findMany({ 
        where: { serverId: id }, 
        orderBy: { timestamp: "desc" }, 
        take: 288 // ~24h of data at 5m intervals
      }),
      p.serviceSnapshot.findFirst({ where: { serverId: id }, orderBy: { timestamp: "desc" } }),
      p.userActivitySnapshot.findFirst({ where: { serverId: id }, orderBy: { timestamp: "desc" } }),
      p.auditSnapshot.findFirst({ where: { serverId: id }, orderBy: { timestamp: "desc" } }),
      p.securitySnapshot.findFirst({ where: { serverId: id }, orderBy: { timestamp: "desc" } }),
    ]);

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Linux Monitor SaaS";
      workbook.lastModifiedBy = session.user.name || "Admin";
      workbook.created = new Date();

      // --- SHEET 1: PERFORMANCE METRICS ---
      const metricSheet = workbook.addWorksheet("Performance Metrics");
      metricSheet.columns = [
        { header: "Timestamp", key: "ts", width: 25 },
        { header: "CPU (%)", key: "cpu", width: 10 },
        { header: "RAM (%)", key: "ram", width: 10 },
        { header: "Disk (%)", key: "disk", width: 10 },
        { header: "Load 1m", key: "l1", width: 10 },
        { header: "Load 5m", key: "l5", width: 10 },
        { header: "Load 15m", key: "l15", width: 10 },
        { header: "Uptime (s)", key: "up", width: 15 },
      ];
      metrics.forEach((m: any) => {
        metricSheet.addRow({
          ts: m.timestamp.toISOString(),
          cpu: m.cpuPercent,
          ram: m.memoryPercent,
          disk: m.diskPercent,
          l1: m.loadAvg1,
          l5: m.loadAvg5,
          l15: m.loadAvg15,
          up: m.uptimeSeconds
        });
      });

      // --- SHEET 2: SERVICES & PORTS ---
      const serviceSheet = workbook.addWorksheet("Services & Ports");
      serviceSheet.columns = [
        { header: "Service Name", key: "name", width: 30 },
        { header: "Status", key: "status", width: 15 },
        { header: "Description/Details", key: "desc", width: 50 },
      ];
      if (services?.services) {
        try {
          const parsedServices = JSON.parse(services.services);
          if (Array.isArray(parsedServices)) {
            parsedServices.forEach((s: any) => {
              serviceSheet.addRow({
                name: s.name || s.unit || "N/A",
                status: s.status || s.active || "N/A",
                desc: s.description || s.sub || ""
              });
            });
          }
        } catch (e) { console.error("Parse services error", e); }
      }

      // --- SHEET 3: USER ACTIVITY ---
      const activitySheet = workbook.addWorksheet("User Activity");
      activitySheet.columns = [
        { header: "Category", key: "cat", width: 20 },
        { header: "Detail", key: "detail", width: 80 },
      ];
      if (activity) {
        try {
          const history = JSON.parse(activity.loginHistory || "[]");
          history.forEach((h: any) => activitySheet.addRow({ cat: "Login History", detail: JSON.stringify(h) }));
          
          const sudo = JSON.parse(activity.sudoEvents || "[]");
          sudo.forEach((e: any) => activitySheet.addRow({ cat: "Sudo Event", detail: e.message || e }));
          
          const ssh = JSON.parse(activity.sshEvents || "[]");
          ssh.forEach((e: any) => activitySheet.addRow({ cat: "SSH Event", detail: e.message || e }));
        } catch (e) { console.error("Parse activity error", e); }
      }

      // --- SHEET 4: AUDIT LOGS ---
      const auditSheet = workbook.addWorksheet("Audit Logs");
      auditSheet.columns = [
        { header: "Timestamp", key: "ts", width: 25 },
        { header: "Log Type", key: "type", width: 15 },
        { header: "Content", key: "content", width: 100 },
      ];
      if (audit) {
        try {
          const events = JSON.parse(audit.auditEvents || "[]");
          events.forEach((e: any) => auditSheet.addRow({ ts: e.timestamp || audit.timestamp.toISOString(), type: "Audit", content: e.message || JSON.stringify(e) }));
          
          const kernel = JSON.parse(audit.kernelMsgs || "[]");
          kernel.forEach((k: any) => auditSheet.addRow({ ts: audit.timestamp.toISOString(), type: "Kernel", content: k }));
        } catch (e) { console.error("Parse audit error", e); }
      }

      // --- SHEET 5: SECURITY EVENTS ---
      const securitySheet = workbook.addWorksheet("Security Events");
      securitySheet.columns = [
        { header: "Event Type", key: "type", width: 20 },
        { header: "Message/Detail", key: "detail", width: 100 },
      ];
      if (security) {
        try {
          const fim = JSON.parse(security.fimEvents || "[]");
          fim.forEach((f: any) => securitySheet.addRow({ type: "File Integrity", detail: JSON.stringify(f) }));
          
          const fw = JSON.parse(security.firewallRules || "[]");
          fw.forEach((rule: any) => securitySheet.addRow({ type: "Firewall Rule", detail: rule }));
        } catch (e) { console.error("Parse security error", e); }
      }

      // Stylize headers
      workbook.worksheets.forEach(ws => {
        ws.getRow(1).font = { bold: true };
        ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `full-report-${server.name}-${new Date().toISOString().split("T")[0]}.xlsx`;

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    } else {
      // --- CSV FORMAT (CONCATENATED) ---
      let csv = `--- SERVER REPORT: ${server.name} ---\n`;
      csv += `Generated: ${new Date().toISOString()}\n\n`;

      // Metrics
      csv += "--- METRICS ---\nTimestamp,CPU%,RAM%,Disk%,Load1m,Load5m,Load15m,UptimeSeconds\n";
      metrics.forEach((m: any) => {
        csv += `${m.timestamp.toISOString()},${m.cpuPercent},${m.memoryPercent},${m.diskPercent},${m.loadAvg1},${m.loadAvg5},${m.loadAvg15},${m.uptimeSeconds}\n`;
      });

      // Simple category summary for CSV
      csv += "\n--- SUMMARY ---\n";
      csv += `Last Seen: ${server.lastSeenAt.toISOString()}\n`;
      csv += `Services Count: ${services ? JSON.parse(services.services || "[]").length : 0}\n`;
      csv += `Audit Events: ${audit ? JSON.parse(audit.auditEvents || "[]").length : 0}\n`;

      const fileName = `report-${server.name}-${new Date().toISOString().split("T")[0]}.csv`;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 });
  }
}
