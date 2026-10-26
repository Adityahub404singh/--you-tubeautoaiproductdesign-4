import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.redirect(new URL("/login?next=%2Fdashboard%2Fautopilot", request.url));

  const { searchParams, origin } = new URL(request.url);
  const action = searchParams.get("action");
  if (action && action !== "connect") return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Missing Google OAuth client ID." }, { status: 500 });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || origin).replace(/\/+$/, "");
  const redirectUri = `${appUrl}/api/youtube/callback`;
  const state = crypto.randomBytes(32).toString("hex");
  const jar = await cookies();
  jar.set("youtube_oauth_state", state, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/youtube/callback", maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
