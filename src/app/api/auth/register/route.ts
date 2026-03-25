import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Invalid email or password (min 6 chars)" },
        { status: 400 }
      );
    }

    const existing = await (prisma as any).user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const userCount = await (prisma as any).user.count();
    const isFirstUser = userCount === 0;

    const hashedPassword = await hashPassword(password);
    const user = await (prisma as any).user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isAdmin: isFirstUser,
      },
    });

    await createSession(user.id);

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
