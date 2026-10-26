$ErrorActionPreference = "Stop"

# Run from the project root. This patch only backs up and replaces three API
# route files and updates the billing endpoint URL. It does not touch the DB.
$root = (Get-Location).Path
$required = @(
  "app\api\auth\[...nextauth]\route.ts",
  "app\api\db\users\route.ts",
  "app\api\db\channels\route.ts",
  "app\api\db\videos\route.ts",
  "app\dashboard\billing\page.tsx"
)
foreach ($p in $required) {
  if (-not (Test-Path -LiteralPath $p)) { throw "Required file missing: $p. Run this from the project root." }
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $root "backups\api-security-$stamp"
foreach ($p in $required | Where-Object { $_ -ne "app\api\auth\[...nextauth]\route.ts" }) {
  $dest = Join-Path $backup $p
  New-Item -ItemType Directory -Path (Split-Path -Parent $dest) -Force | Out-Null
  Copy-Item -LiteralPath $p -Destination $dest
}

$users = @'
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

const publicUserSelect = {
  id: true, email: true, name: true, phone: true, role: true, plan: true,
  hasCompletedSetup: true, freeVideosUsed: true, paidVideoCredits: true,
  totalSpent: true,
} as const;

export async function GET() {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    // Keep the { user } response shape expected by the billing page.
    return NextResponse.json({ user });
  } catch (error) {
    console.error("DB users GET error:", error);
    return NextResponse.json({ error: "Failed to fetch user." }, { status: 500 });
  }
}

// Account creation is handled by /api/auth/signup. Do not expose a generic
// unauthenticated upsert that could overwrite role, plan, or password.
export async function POST() {
  return NextResponse.json(
    { error: "Use the signup endpoint to create an account." },
    { status: 405, headers: { Allow: "GET, PATCH" } }
  );
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const data: { name?: string; phone?: string; hasCompletedSetup?: boolean } = {};

    if (input.name !== undefined) {
      if (typeof input.name !== "string" || !input.name.trim() || input.name.length > 100)
        return NextResponse.json({ error: "Invalid name." }, { status: 400 });
      data.name = input.name.trim();
    }
    if (input.phone !== undefined) {
      if (typeof input.phone !== "string" || input.phone.length > 30)
        return NextResponse.json({ error: "Invalid phone." }, { status: 400 });
      data.phone = input.phone.trim();
    }
    if (input.hasCompletedSetup !== undefined) {
      if (typeof input.hasCompletedSetup !== "boolean")
        return NextResponse.json({ error: "Invalid setup status." }, { status: 400 });
      data.hasCompletedSetup = input.hasCompletedSetup;
    }
    if (Object.keys(data).length === 0)
      return NextResponse.json({ error: "No allowed fields to update." }, { status: 400 });

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("DB users PATCH error:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
'@

$channels = @'
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
'@

$videos = @'
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
'@

Set-Content -LiteralPath "app\api\db\users\route.ts" -Value $users -Encoding utf8
Set-Content -LiteralPath "app\api\db\channels\route.ts" -Value $channels -Encoding utf8
Set-Content -LiteralPath "app\api\db\videos\route.ts" -Value $videos -Encoding utf8

# No hardcoded user ID in billing: endpoint now returns the signed-in user's
# safe public fields under { user }.
$billing = "app\dashboard\billing\page.tsx"
$content = Get-Content -LiteralPath $billing -Raw
$content = $content.Replace('fetch("/api/db/users")', 'fetch("/api/db/users", { cache: "no-store" })')
Set-Content -LiteralPath $billing -Value $content -Encoding utf8

Write-Host "`nPatch applied. Backup: $backup"
Write-Host "`nNext run: npx tsc --noEmit"
