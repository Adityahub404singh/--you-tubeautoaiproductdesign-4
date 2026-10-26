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

export async function GET(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const where: { userId: string; channelId?: string; status?: string } = { userId };
    const channelId = searchParams.get("channelId");
    const status = searchParams.get("status");
    if (channelId) where.channelId = channelId;
    if (status) where.status = status;

    const videos = await prisma.video.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(videos);
  } catch (error) {
    console.error("DB videos GET error:", error);
    return NextResponse.json({ error: "Failed to fetch videos." }, { status: 500 });
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
    if (typeof input.channelId !== "string" || !input.channelId ||
        typeof input.title !== "string" || !input.title.trim() ||
        typeof input.topic !== "string" || !input.topic.trim()) {
      return NextResponse.json({ error: "channelId, title, and topic are required." }, { status: 400 });
    }
    const channel = await prisma.channel.findFirst({ where: { id: input.channelId, userId }, select: { id: true } });
    if (!channel) return NextResponse.json({ error: "Channel not found." }, { status: 404 });

    const video = await prisma.video.create({
      data: {
        userId,
        channelId: channel.id,
        title: input.title.trim().slice(0, 100),
        topic: input.topic.trim().slice(0, 500),
        ...(typeof input.subCategory === "string" && { subCategory: input.subCategory.slice(0, 80) }),
        ...(typeof input.description === "string" && { description: input.description.slice(0, 5000) }),
        ...(typeof input.tags === "string" ? { tags: input.tags.slice(0, 5000) } :
          Array.isArray(input.tags) ? { tags: JSON.stringify(input.tags.filter((x): x is string => typeof x === "string").slice(0, 50)) } : {}),
        ...(typeof input.script === "string" && { script: input.script.slice(0, 100000) }),
        ...(typeof input.hook === "string" && { hook: input.hook.slice(0, 2000) }),
        ...(typeof input.videoType === "string" && { videoType: input.videoType.slice(0, 20) }),
        ...(typeof input.audioUrl === "string" && { audioUrl: input.audioUrl.slice(0, 2000) }),
        ...(typeof input.thumbnailUrl === "string" && { thumbnailUrl: input.thumbnailUrl.slice(0, 2000) }),
        ...(typeof input.videoFileUrl === "string" && { videoFileUrl: input.videoFileUrl.slice(0, 2000) }),
      },
    });
    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("DB videos POST error:", error);
    return NextResponse.json({ error: "Failed to create video." }, { status: 500 });
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
      return NextResponse.json({ error: "Video ID is required." }, { status: 400 });

    const existing = await prisma.video.findFirst({ where: { id: input.id, userId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Video not found." }, { status: 404 });

    const data: Record<string, unknown> = {};
    const stringLimits: Record<string, number> = {
      title: 100, topic: 500, subCategory: 80, description: 5000, tags: 5000,
      script: 100000, hook: 2000, videoType: 20, audioUrl: 2000,
      thumbnailUrl: 2000, videoFileUrl: 2000, uploadError: 1000,
    };
    for (const [key, max] of Object.entries(stringLimits)) {
      const value = input[key];
      if (value !== undefined) {
        if (key === "tags" && Array.isArray(value)) {
          data.tags = JSON.stringify(value.filter((x): x is string => typeof x === "string").slice(0, 50));
        } else if (typeof value === "string" && value.length <= max) {
          data[key] = value;
        } else {
          return NextResponse.json({ error: `Invalid ${key}.` }, { status: 400 });
        }
      }
    }
    if (Object.keys(data).length === 0)
      return NextResponse.json({ error: "No allowed fields to update." }, { status: 400 });

    const video = await prisma.video.update({ where: { id: existing.id }, data });
    return NextResponse.json(video);
  } catch (error) {
    console.error("DB videos PATCH error:", error);
    return NextResponse.json({ error: "Failed to update video." }, { status: 500 });
  }
}
