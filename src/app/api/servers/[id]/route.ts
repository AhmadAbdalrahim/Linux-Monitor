import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        metrics: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    if (!server || (server.userId !== session.user.id && !(session.user as any).isAdmin)) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const formatted = {
      id: server.id,
      name: server.name,
      hostname: server.hostname,
      agentKey: server.agentKey,
      ip: server.ip,
      os: server.os,
      kernel: server.kernel,
      cpuModel: server.cpuModel,
      cpuCores: server.cpuCores,
      userId: server.userId,
      lastSeenAt: server.lastSeenAt,
      createdAt: server.createdAt,
      memoryTotal: server.memoryTotal.toString(),
      latestMetric: server.metrics[0]
        ? {
            ...server.metrics[0],
            memoryTotal: server.metrics[0].memoryTotal.toString(),
            memoryUsed: server.metrics[0].memoryUsed.toString(),
            memBuffers: server.metrics[0].memBuffers.toString(),
            memCached: server.metrics[0].memCached.toString(),
            swapTotal: server.metrics[0].swapTotal.toString(),
            swapUsed: server.metrics[0].swapUsed.toString(),
            diskTotal: server.metrics[0].diskTotal.toString(),
            diskUsed: server.metrics[0].diskUsed.toString(),
            networkBytesSent: server.metrics[0].networkBytesSent.toString(),
            networkBytesRecv: server.metrics[0].networkBytesRecv.toString(),
          }
        : null,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Server fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch server" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    const server = await prisma.server.findUnique({ where: { id } });
    if (!server || (server.userId !== session.user.id && !(session.user as any).isAdmin)) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const updated = await prisma.server.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, name: updated.name });
  } catch (error) {
    console.error("Server rename error:", error);
    return NextResponse.json({ error: "Failed to rename server" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const server = await prisma.server.findUnique({ where: { id } });
    if (!server || (server.userId !== session.user.id && !session.user.isAdmin)) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    await prisma.server.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Server delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete server" },
      { status: 500 }
    );
  }
}
