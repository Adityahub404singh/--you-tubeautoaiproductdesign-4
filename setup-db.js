
const fs = require("fs");
const path = require("path");

function writeFile(relativePath, content) {
  const fullPath = path.join(process.cwd(), relativePath);

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trimStart(), "utf8");

  console.log("Created:", relativePath);
}

// Database client
writeFile(
  "lib/db.ts",
  `
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
`
);

// Users API
writeFile(
  "app/api/db/users/route.ts",
  `
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
`
);

// Videos API
writeFile(
  "app/api/db/videos/route.ts",
  `
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
`
);

// Channels API
writeFile(
  "app/api/db/channels/route.ts",
  `
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
`
);

console.log("All DB API files created successfully.");
