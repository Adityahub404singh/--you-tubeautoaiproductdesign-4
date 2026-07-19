import { NextResponse } from "next/server";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  
  if (!code) return NextResponse.redirect(new URL("/dashboard?error=NoCode", req.url));

  const redirectUri = "http://localhost:3000/api/youtube/callback";

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    const res = NextResponse.redirect(new URL("/dashboard?youtube=connected", req.url));

    // FINALLY! SAVING THE TOKENS PROPERLY
    res.cookies.set("yt_access_token", tokenData.access_token, { httpOnly: true, path: "/", maxAge: tokenData.expires_in });
    
    if (tokenData.refresh_token) {
      res.cookies.set("yt_refresh_token", tokenData.refresh_token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 365 }); // Save for 1 year
    }

    return res;
  } catch (error) {
    console.error("YouTube Callback Error:", error);
    return NextResponse.redirect(new URL("/dashboard?error=TokenFail", req.url));
  }
}

