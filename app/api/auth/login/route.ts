
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    // Reject unknown users and accounts without a password.
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || "",
        role: user.role,
        plan: user.plan,
        hasCompletedSetup: !!user.hasCompletedSetup,
        freeVideosUsed: user.freeVideosUsed || 0,
        paidVideoCredits: user.paidVideoCredits || 0,
      },
    });
  } catch (error: unknown) {
    console.error("Login Error:", error);

    return NextResponse.json(
      { error: "Unable to process login right now" },
      { status: 500 }
    );
  }
}
