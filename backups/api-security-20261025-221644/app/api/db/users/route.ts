import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const id = searchParams.get("id");

    if (email) {
      return NextResponse.json(
        await prisma.user.findUnique({ where: { email } })
      );
    }

    if (id) {
      return NextResponse.json(
        await prisma.user.findUnique({ where: { id } })
      );
    }

    return NextResponse.json(await prisma.user.findMany());
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: data,
      create: data,
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save user" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}
