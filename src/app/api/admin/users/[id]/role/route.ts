import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const user = session?.user as any;

    if (!session || !user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isAdmin } = body;

    // Prevent removing your own admin rights by accident
    if (id === user.id && isAdmin === false) {
      return NextResponse.json({ error: "Cannot revoke your own admin rights" }, { status: 400 });
    }

    const targetUser = await (prisma as any).user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await (prisma as any).user.update({
      where: { id },
      data: { isAdmin },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin role update error:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
