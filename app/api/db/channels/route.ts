import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function currentUserId() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function GET() {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    const channels = await prisma.channel.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(channels);
  } catch (error) {
    console.error("DB channels GET error:", error);
    return NextResponse.json({ error: "Failed to fetch channels." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body))
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

    const input = body as Record<string, unknown>;
    if (typeof input.name !== "string" || !input.name.trim() || input.name.length > 100)
      return NextResponse.json({ error: "A valid channel name is required." }, { status: 400 });

    const channel = await prisma.channel.create({
      data: {
        userId,
        name: input.name.trim(),
        ...(typeof input.category === "string" && { category: input.category.slice(0, 80) }),
        ...(typeof input.language === "string" && { language: input.language.slice(0, 20) }),
        ...(typeof input.voice === "string" && { voice: input.voice.slice(0, 100) }),
        ...(typeof input.defaultTags === "string" && { defaultTags: input.defaultTags.slice(0, 2000) }),
        ...(typeof input.uploadTime === "string" && { uploadTime: input.uploadTime.slice(0, 20) }),
        ...(typeof input.contentStrategy === "string" && { contentStrategy: input.contentStrategy.slice(0, 4000) }),
        ...(typeof input.isActive === "boolean" && { isActive: input.isActive }),
      },
    });
    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error("DB channels POST error:", error);
    return NextResponse.json({ error: "Failed to create channel." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body))
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const input = body as Record<string, unknown>;
    if (typeof input.id !== "string" || !input.id)
      return NextResponse.json({ error: "Channel ID is required." }, { status: 400 });

    const existing = await prisma.channel.findFirst({ where: { id: input.id, userId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Channel not found." }, { status: 404 });

    const data: Record<string, unknown> = {};
    for (const key of ["name", "category", "language", "voice", "defaultTags", "uploadTime", "contentStrategy"] as const) {
      const value = input[key];
      if (value !== undefined) {
        if (typeof value !== "string") return NextResponse.json({ error: `Invalid ${key}.` }, { status: 400 });
        const max = key === "contentStrategy" ? 4000 : key === "defaultTags" ? 2000 : key === "name" ? 100 : 100;
        if (value.length > max || (key === "name" && !value.trim()))
          return NextResponse.json({ error: `Invalid ${key}.` }, { status: 400 });
        data[key] = key === "name" ? value.trim() : value;
      }
    }
    if (input.isActive !== undefined) {
      if (typeof input.isActive !== "boolean") return NextResponse.json({ error: "Invalid isActive." }, { status: 400 });
      data.isActive = input.isActive;
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: "No allowed fields to update." }, { status: 400 });

    const channel = await prisma.channel.update({ where: { id: existing.id }, data });
    return NextResponse.json(channel);
  } catch (error) {
    console.error("DB channels PATCH error:", error);
    return NextResponse.json({ error: "Failed to update channel." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body))
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const id = (body as Record<string, unknown>).id;
    if (typeof id !== "string" || !id)
      return NextResponse.json({ error: "Channel ID is required." }, { status: 400 });

    const existing = await prisma.channel.findFirst({
      where: { id, userId },
      select: { id: true, _count: { select: { videos: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Channel not found." }, { status: 404 });
    if (existing._count.videos > 0)
      return NextResponse.json({ error: "This channel has videos and cannot be deleted yet." }, { status: 409 });

    await prisma.channel.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DB channels DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete channel." }, { status: 500 });
  }
}
