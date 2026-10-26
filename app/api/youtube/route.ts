
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const action = searchParams.get("action");

  if (action !== "connect") {
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  }

  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.YOUTUBE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth client ID is not configured." },
      { status: 500 }
    );
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || origin
  ).replace(/\/+$/, "");

  const redirectUri = `${appUrl}/api/youtube/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope:
      "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
    access_type: "offline",
    prompt: "consent",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
