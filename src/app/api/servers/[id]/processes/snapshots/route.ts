import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "500", 10);

    const where: { serverId: string; timestamp?: { gte?: Date; lte?: Date } } = {
      serverId: id,
    };
    if (fromParam) {
      where.timestamp = { ...where.timestamp, gte: new Date(fromParam) };
    }
    if (toParam) {
      where.timestamp = { ...where.timestamp, lte: new Date(toParam) };
    }

    const snapshots = await prisma.processSnapshot.findMany({
      where,
      select: { id: true, timestamp: true },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json(
      snapshots.map((s) => ({ id: s.id, timestamp: s.timestamp }))
    );
  } catch (error) {
    console.error("Snapshots fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch snapshots" },
      { status: 500 }
    );
  }
}
