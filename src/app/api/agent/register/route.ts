import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, hostname, ip, os, kernel, cpuModel, cpuCores, memoryTotal, agentKey } = body;

    if (!name || !hostname) {
      return NextResponse.json(
        { error: "name and hostname are required" },
        { status: 400 }
      );
    }

    // Use provided agent key or generate new one
    const key = agentKey || uuidv4();

    // Update existing server record
    const server = await prisma.server.update({
      where: { agentKey: key },
      data: {
        hostname,
        ip: ip || null,
        os: os || null,
        kernel: kernel || null,
        cpuModel: cpuModel || null,
        cpuCores: cpuCores || 0,
        memoryTotal: BigInt(memoryTotal || 0),
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({
      id: server.id,
      agentKey: server.agentKey,
      message: "Server registered successfully",
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Failed to register server" },
      { status: 500 }
    );
  }
}
