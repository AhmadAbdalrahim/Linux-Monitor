import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const server = await prisma.server.findUnique({ where: { id } });
    if (!server || (server.userId !== session.user.id && !(session.user as any).isAdmin)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const snap = await (prisma as any).securitySnapshot.findFirst({
      where: { serverId: id },
      orderBy: { timestamp: "desc" },
    });

    if (!snap) return NextResponse.json(null);

    return NextResponse.json({
      timestamp: snap.timestamp,
      isRoot: snap.isRoot,
      fimEvents: JSON.parse(snap.fimEvents),
      firewallRules: JSON.parse(snap.firewallRules),
      selinuxEvents: JSON.parse(snap.selinuxEvents),
      appArmorEvents: JSON.parse(snap.appArmorEvents),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
