import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const where: any = {};

    const channelId = searchParams.get("channelId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    if (channelId) where.channelId = channelId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const videos = await prisma.video.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(videos);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (Array.isArray(data.tags)) {
      data.tags = JSON.stringify(data.tags);
    }

    const video = await prisma.video.create({ data });
    return NextResponse.json(video);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create video" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();

    if (Array.isArray(updates.tags)) {
      updates.tags = JSON.stringify(updates.tags);
    }

    const video = await prisma.video.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json(video);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update video" },
      { status: 500 }
    );
  }
}
