
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const action = searchParams.get("action");

  if (action !== "connect") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const appId = process.env.INSTAGRAM_APP_ID;
  const appUrl = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    origin
  ).replace(/\/+$/, "");

  if (!appId) {
    return NextResponse.json(
      { error: "Missing INSTAGRAM_APP_ID" },
      { status: 500 }
    );
  }

  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI ||
    `${appUrl}/api/auth/instagram/callback`;

  const state = randomBytes(32).toString("hex");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope:
      "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
    response_type: "code",
    state,
  });

  const response = NextResponse.redirect(
    `https://www.facebook.com/v22.0/dialog/oauth?${params.toString()}`
  );

  response.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
