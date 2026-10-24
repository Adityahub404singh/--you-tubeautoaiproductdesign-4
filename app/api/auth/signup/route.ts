import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        name,
        phone: phone || "",
        password: hashedPassword,
        role: "user",
        plan: "free",
        hasCompletedSetup: false,
        freeVideosUsed: 0,
        paidVideoCredits: 0
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone || "",
        role: newUser.role,
        plan: newUser.plan,
        hasCompletedSetup: false,
        freeVideosUsed: 0,
        paidVideoCredits: 0
      }
    });
  } catch (error: any) {
    console.error("Signup Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
