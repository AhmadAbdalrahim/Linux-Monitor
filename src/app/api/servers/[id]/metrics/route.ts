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
    const server = await prisma.server.findUnique({ where: { id } });
    if (!server || (server.userId !== session.user.id && !(session.user as any).isAdmin)) {
       return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const hours = parseInt(searchParams.get("hours") || "24", 10);
    const limit = parseInt(searchParams.get("limit") || "500", 10);

    let since: Date;
    let until: Date | undefined;

    if (fromParam && toParam) {
      since = new Date(fromParam);
      until = new Date(toParam);
    } else if (fromParam) {
      since = new Date(fromParam);
      until = new Date(since.getTime() + 24 * 60 * 60 * 1000);
    } else if (toParam) {
      until = new Date(toParam);
      since = new Date(until.getTime() - hours * 60 * 60 * 1000);
    } else {
      since = new Date(Date.now() - hours * 60 * 60 * 1000);
      until = undefined;
    }

    const metrics = await prisma.metric.findMany({
      where: {
        serverId: id,
        timestamp: {
          gte: since,
          ...(until && { lte: until }),
        },
      },
      orderBy: { timestamp: "asc" },
      take: limit,
    });

    const formatted = metrics.map((m) => ({
      ...m,
      memoryTotal: m.memoryTotal.toString(),
      memoryUsed: m.memoryUsed.toString(),
      memBuffers: m.memBuffers.toString(),
      memCached: m.memCached.toString(),
      swapTotal: m.swapTotal.toString(),
      swapUsed: m.swapUsed.toString(),
      diskTotal: m.diskTotal.toString(),
      diskUsed: m.diskUsed.toString(),
      networkBytesSent: m.networkBytesSent.toString(),
      networkBytesRecv: m.networkBytesRecv.toString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Metrics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
