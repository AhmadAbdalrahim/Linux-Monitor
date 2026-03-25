import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentKey, fimEvents, firewallRules, selinuxEvents, appArmorEvents } = body;

    if (!agentKey) return NextResponse.json({ error: "Missing agentKey" }, { status: 400 });

    const server = await prisma.server.findUnique({ where: { agentKey } });
    if (!server) return NextResponse.json({ error: "Unknown agent key" }, { status: 401 });

    await prisma.securitySnapshot.create({
      data: {
        serverId: server.id,
        isRoot: body.isRoot ?? true,
        fimEvents: JSON.stringify(fimEvents || []),
        firewallRules: JSON.stringify(firewallRules || "[]"),
        selinuxEvents: JSON.stringify(selinuxEvents || []),
        appArmorEvents: JSON.stringify(appArmorEvents || []),
      },
    });

    const old = await prisma.securitySnapshot.findMany({
      where: { serverId: server.id },
      orderBy: { timestamp: "desc" },
      skip: 50,
      select: { id: true },
    });
    if (old.length > 0) {
      await prisma.securitySnapshot.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Security push error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
