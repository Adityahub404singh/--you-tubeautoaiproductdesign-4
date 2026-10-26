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
