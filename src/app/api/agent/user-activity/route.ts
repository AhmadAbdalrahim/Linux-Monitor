import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentKey, activeSessions, loginHistory, sudoEvents, sshEvents } = body;

    if (!agentKey) return NextResponse.json({ error: "Missing agentKey" }, { status: 400 });

    const server = await prisma.server.findUnique({ where: { agentKey } });
    if (!server) return NextResponse.json({ error: "Unknown agent key" }, { status: 401 });

    await prisma.userActivitySnapshot.create({
      data: {
        serverId: server.id,
        isRoot: body.isRoot ?? true,
        activeSessions: JSON.stringify(activeSessions || []),
        loginHistory: JSON.stringify(loginHistory || []),
        sudoEvents: JSON.stringify(sudoEvents || []),
        sshEvents: JSON.stringify(sshEvents || []),
      },
    });

    const old = await prisma.userActivitySnapshot.findMany({
      where: { serverId: server.id },
      orderBy: { timestamp: "desc" },
      skip: 50,
      select: { id: true },
    });
    if (old.length > 0) {
      await prisma.userActivitySnapshot.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User activity push error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
