import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "connect" || !action) {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || "";
    if (!clientId) {
      return NextResponse.json({ error: "Missing GOOGLE_CLIENT_ID or YOUTUBE_CLIENT_ID" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin || "http://localhost:3000";
    const redirectUri = `${appUrl.replace(/\/+$/, "")}/api/youtube/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
      access_type: "offline",
      prompt: "consent",
    });

    console.log("[YOUTUBE OAUTH] Redirecting with URI:", redirectUri);
    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
