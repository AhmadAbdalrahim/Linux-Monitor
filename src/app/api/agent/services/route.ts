import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentKey, services, ports, cronJobs } = body;

    if (!agentKey) return NextResponse.json({ error: "Missing agentKey" }, { status: 400 });

    const server = await prisma.server.findUnique({ where: { agentKey } });
    if (!server) return NextResponse.json({ error: "Unknown agent key" }, { status: 401 });

    await prisma.serviceSnapshot.create({
      data: {
        serverId: server.id,
        services: JSON.stringify(services || []),
        ports: JSON.stringify(ports || []),
        cronJobs: JSON.stringify(cronJobs || []),
      },
    });

    // Trim old records — keep last 50 per server
    const old = await prisma.serviceSnapshot.findMany({
      where: { serverId: server.id },
      orderBy: { timestamp: "desc" },
      skip: 50,
      select: { id: true },
    });
    if (old.length > 0) {
      await prisma.serviceSnapshot.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Services push error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
