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

    const snap = await (prisma as any).serviceSnapshot.findFirst({
      where: { serverId: id },
      orderBy: { timestamp: "desc" },
    });

    if (!snap) return NextResponse.json(null);

    return NextResponse.json({
      timestamp: snap.timestamp,
      services: JSON.parse(snap.services),
      ports: JSON.parse(snap.ports),
      cronJobs: JSON.parse(snap.cronJobs),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
