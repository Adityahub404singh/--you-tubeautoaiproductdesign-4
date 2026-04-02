import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "connect") {
    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      scope: "instagram_content_publish,instagram_basic,pages_show_list,pages_read_engagement",
      response_type: "code",
      state: Math.random().toString(36).substring(7),
    });
    return NextResponse.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
