import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const servers = await prisma.server.findMany({
      where: { userId: session.user.id },
      orderBy: { sortOrder: "asc" },
      include: {
        metrics: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    console.log(`[DEBUG] Found ${servers.length} servers for user ${session.user.id} (${session.user.email})`);

    const formatted = servers.map((s) => ({
      id: s.id,
      name: s.name,
      hostname: s.hostname,
      agentKey: s.agentKey,
      ip: s.ip,
      os: s.os,
      kernel: s.kernel,
      cpuModel: s.cpuModel,
      cpuCores: s.cpuCores,
      userId: s.userId,
      lastSeenAt: s.lastSeenAt,
      createdAt: s.createdAt,
      memoryTotal: s.memoryTotal.toString(),
      latestMetric: s.metrics[0]
        ? {
            ...s.metrics[0],
            memoryTotal: s.metrics[0].memoryTotal.toString(),
            memoryUsed: s.metrics[0].memoryUsed.toString(),
            memBuffers: s.metrics[0].memBuffers.toString(),
            memCached: s.metrics[0].memCached.toString(),
            swapTotal: s.metrics[0].swapTotal.toString(),
            swapUsed: s.metrics[0].swapUsed.toString(),
            diskTotal: s.metrics[0].diskTotal.toString(),
            diskUsed: s.metrics[0].diskUsed.toString(),
            networkBytesSent: s.metrics[0].networkBytesSent.toString(),
            networkBytesRecv: s.metrics[0].networkBytesRecv.toString(),
          }
        : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Servers fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch servers" },
      { status: 500 }
    );
  }
}
