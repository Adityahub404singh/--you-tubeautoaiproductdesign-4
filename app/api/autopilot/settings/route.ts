
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaults = {
  category: "cinematic",
  subCategory: "sigma",
  cronSchedule: "0 18 * * *",
  isAutoApprove: false,
  language: "en",
  isActive: false,
};

function validCron(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 100) {
    return false;
  }

  const fields = value.trim().split(/\s+/);

  return (
    fields.length === 5 &&
    fields.every((field) => /^[0-9*/,-]+$/.test(field))
  );
}

async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);

  const userId = (session?.user as { id?: string } | undefined)?.id;

  return typeof userId === "string" && userId.length > 0
    ? userId
    : null;
}

export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const settings = await prisma.autopilotSettings.findUnique({
      where: { userId },
    });

    return NextResponse.json({
      settings: settings ?? { ...defaults },
    });
  } catch (error) {
    console.error("Autopilot settings GET error:", error);

    return NextResponse.json(
      { error: "Unable to load autopilot settings." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const category = typeof data.category === "string" ? data.category.trim().toLowerCase() : defaults.category;

    const subCategory =
      typeof data.subCategory === "string"
        ? data.subCategory.trim()
        : defaults.subCategory;

    const language =
      typeof data.language === "string"
        ? data.language.trim()
        : defaults.language;

    const cronSchedule =
      data.cronSchedule ?? defaults.cronSchedule;

    if (!category || category.length > 50 || !/^[a-z0-9 _-]+$/.test(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    if (!subCategory || subCategory.length > 80) {
      return NextResponse.json(
        { error: "Invalid subCategory." },
        { status: 400 }
      );
    }

    if (!language || language.length > 20) {
      return NextResponse.json(
        { error: "Invalid language." },
        { status: 400 }
      );
    }

    if (!validCron(cronSchedule)) {
      return NextResponse.json(
        { error: "Schedule must contain five valid-format cron fields." },
        { status: 400 }
      );
    }

    if (
      data.isActive !== undefined &&
      typeof data.isActive !== "boolean"
    ) {
      return NextResponse.json(
        { error: "isActive must be true or false." },
        { status: 400 }
      );
    }

    if (
      data.isAutoApprove !== undefined &&
      typeof data.isAutoApprove !== "boolean"
    ) {
      return NextResponse.json(
        { error: "isAutoApprove must be true or false." },
        { status: 400 }
      );
    }

    const settings = await prisma.autopilotSettings.upsert({
      where: { userId },

      create: {
        userId,
        category,
        subCategory,
        language,
        cronSchedule: cronSchedule.trim(),
        isAutoApprove: data.isAutoApprove ?? false,
        isActive: data.isActive ?? false,
      },

      update: {
        category,
        subCategory,
        language,
        cronSchedule: cronSchedule.trim(),

        ...(data.isAutoApprove !== undefined && {
          isAutoApprove: data.isAutoApprove,
        }),

        ...(data.isActive !== undefined && {
          isActive: data.isActive,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Autopilot settings POST error:", error);

    return NextResponse.json(
      { error: "Unable to save autopilot settings." },
      { status: 500 }
    );
  }
}
