import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("action") === "connect") {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      // 🔥 CHOR PAKDA GAYA: ENV variable hata kar direct Live URL daal diya
      redirect_uri: "https://youtubeautoaiproductdesign5.vercel.app/api/youtube/callback",
      response_type: "code",
      scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
      access_type: "offline",
      prompt: "consent",
    });
    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
