import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentKey, processes } = body;

    if (!agentKey || !Array.isArray(processes)) {
      return NextResponse.json(
        { error: "agentKey and processes array are required" },
        { status: 400 }
      );
    }

    const server = await prisma.server.findUnique({
      where: { agentKey },
    });

    if (!server) {
      return NextResponse.json(
        { error: "Invalid agent key" },
        { status: 401 }
      );
    }

    await prisma.processSnapshot.create({
      data: {
        serverId: server.id,
        processes: JSON.stringify(processes),
      },
    });

    await prisma.server.update({
      where: { id: server.id },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Processes error:", error);
    return NextResponse.json(
      { error: "Failed to store processes" },
      { status: 500 }
    );
  }
}
