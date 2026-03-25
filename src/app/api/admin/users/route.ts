import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, password, name, isAdmin } = await request.json();

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

    const hashedPassword = await hashPassword(password);
    const user = await (prisma as any).user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isAdmin: !!isAdmin,
      },
    });

    console.log(`[ADMIN] User created: ${user.email} (isAdmin: ${user.isAdmin}) by ${session.user.email}`);

    return NextResponse.json({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin });
  } catch (error) {
    console.error("Admin user creation error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
