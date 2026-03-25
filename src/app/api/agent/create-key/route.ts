import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { name } = body;
    const agentKey = uuidv4();

    await prisma.server.create({
      data: {
        name: name || "New Server",
        hostname: "pending",
        agentKey,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      agentKey,
      message: "Add this agent key to your Linux server to start monitoring.",
    });
  } catch (error) {
    console.error("Create key error:", error);
    return NextResponse.json(
      { error: "Failed to create agent key" },
      { status: 500 }
    );
  }
}
