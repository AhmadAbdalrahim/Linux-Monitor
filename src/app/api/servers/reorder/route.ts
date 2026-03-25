import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orders } = await request.json(); // Array of { id: string, sortOrder: number }

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Perform updates only for servers owned by the user
    await prisma.$transaction(
      orders.map((o: { id: string; sortOrder: number }) =>
        prisma.server.updateMany({
          where: { id: o.id, userId: session.user.id },
          data: { sortOrder: o.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
