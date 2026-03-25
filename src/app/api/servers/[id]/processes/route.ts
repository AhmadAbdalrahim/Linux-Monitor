import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Authorization check
    const serverCheck = await prisma.server.findUnique({ where: { id } });
    if (!serverCheck || (serverCheck.userId !== session.user.id && !(session.user as any).isAdmin)) {
       return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const atParam = searchParams.get("at"); // ISO timestamp for point-in-time

    let snapshot;

    if (atParam) {
      const target = new Date(atParam);
      const [before, after] = await Promise.all([
        prisma.processSnapshot.findFirst({
          where: { serverId: id, timestamp: { lte: target } },
          orderBy: { timestamp: "desc" },
        }),
        prisma.processSnapshot.findFirst({
          where: { serverId: id, timestamp: { gte: target } },
          orderBy: { timestamp: "asc" },
        }),
      ]);
      const beforeDist = before
        ? Math.abs(target.getTime() - before.timestamp.getTime())
        : Infinity;
      const afterDist = after
        ? Math.abs(after.timestamp.getTime() - target.getTime())
        : Infinity;
      snapshot = beforeDist <= afterDist ? before : after;
    } else {
      snapshot = await prisma.processSnapshot.findFirst({
        where: { serverId: id },
        orderBy: { timestamp: "desc" },
      });
    }

    if (!snapshot) {
      return NextResponse.json({
        timestamp: null,
        processes: [],
        message: "No process data yet. The agent sends process details every 60 seconds.",
      });
    }

    let processes: unknown[] = [];
    try {
      processes = JSON.parse(snapshot.processes) as unknown[];
    } catch {
      processes = [];
    }

    return NextResponse.json({
      timestamp: snapshot.timestamp,
      processes,
    });
  } catch (error) {
    console.error("Processes fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch processes" },
      { status: 500 }
    );
  }
}
