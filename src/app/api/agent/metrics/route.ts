import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentKey, ...metrics } = body;

    if (!agentKey) {
      return NextResponse.json({ error: "Missing agentKey" }, { status: 400 });
    }

    // Rate Limit: 30 requests per minute per agentKey
    const { success } = rateLimit(agentKey, 30, 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }

    const server = await prisma.server.findUnique({
      where: { agentKey },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Invalid agent key. Register the server first." },
        { status: 401 }
      );
    }

    await prisma.metric.create({
      data: {
        serverId: server.id,
        cpuPercent: metrics.cpuPercent ?? 0,
        cpuPerCore: metrics.cpuPerCore ? JSON.stringify(metrics.cpuPerCore) : null,
        loadAvg1: metrics.loadAvg1 ?? 0,
        loadAvg5: metrics.loadAvg5 ?? 0,
        loadAvg15: metrics.loadAvg15 ?? 0,
        memoryTotal: BigInt(metrics.memoryTotal ?? 0),
        memoryUsed: BigInt(metrics.memoryUsed ?? 0),
        memoryPercent: metrics.memoryPercent ?? 0,
        swapTotal: BigInt(metrics.swapTotal ?? 0),
        swapUsed: BigInt(metrics.swapUsed ?? 0),
        swapPercent: metrics.swapPercent ?? 0,
        diskTotal: BigInt(metrics.diskTotal ?? 0),
        diskUsed: BigInt(metrics.diskUsed ?? 0),
        diskPercent: metrics.diskPercent ?? 0,
        networkBytesSent: BigInt(metrics.networkBytesSent ?? 0),
        networkBytesRecv: BigInt(metrics.networkBytesRecv ?? 0),
        processCount: metrics.processCount ?? 0,
        uptimeSeconds: metrics.uptimeSeconds ?? 0,
      },
    });

    await prisma.server.update({
      where: { id: server.id },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Metrics error:", error);
    return NextResponse.json(
      { error: "Failed to store metrics" },
      { status: 500 }
    );
  }
}
