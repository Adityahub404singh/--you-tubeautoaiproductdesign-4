import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");

    const channels = await prisma.channel.findMany({
      where: userId ? { userId } : {},
    });

    return NextResponse.json(channels);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const channel = await prisma.channel.create({ data });

    return NextResponse.json(channel);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create channel" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();

    const channel = await prisma.channel.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json(channel);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update channel" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    await prisma.channel.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete channel" },
      { status: 500 }
    );
  }
}
