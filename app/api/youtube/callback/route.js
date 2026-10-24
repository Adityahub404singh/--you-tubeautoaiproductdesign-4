import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getBaseUrl(req) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || getBaseUrl(request);
  const cleanAppUrl = appUrl.replace(/\/+$/, "");

  if (error || !code) {
    return NextResponse.redirect(`${cleanAppUrl}/dashboard?youtube=error`);
  }

  try {
    const clientId     = (process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || "").trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || "").trim();

    if (!clientId || !clientSecret) {
      throw new Error("Missing Google/YouTube OAuth Credentials in .env");
    }

    const redirectUri = `${cleanAppUrl}/api/youtube/callback`;

    const bodyString = new URLSearchParams({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString();

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyString,
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("YouTube Google Token API error:", tokenData);
      return NextResponse.redirect(
        `${cleanAppUrl}/dashboard?youtube=error&msg=${encodeURIComponent(tokenData.error_description || tokenData.error)}`
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const cookieStore = await cookies();
    const expiry = new Date(Date.now() + (expires_in || 3600) * 1000);

    cookieStore.set("yt_access_token", access_token, {
      httpOnly: true,
      expires:  expiry,
      path:     "/",
      sameSite: "lax",
    });

    if (refresh_token) {
      cookieStore.set("yt_refresh_token", refresh_token, {
        httpOnly: true,
        expires:  new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 Days
        path:     "/",
        sameSite: "lax",
      });
    }

    cookieStore.set("yt_connected", "true", {
      expires:  new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      path:     "/",
      sameSite: "lax",
    });

    console.log("? YouTube connected successfully!");
    return NextResponse.redirect(`${cleanAppUrl}/dashboard?youtube=connected`);

  } catch (err) {
    console.error("YouTube callback fetch error:", err.message);
    return NextResponse.redirect(
      `${cleanAppUrl}/dashboard?youtube=error&msg=${encodeURIComponent(err.message)}`
    );
  }
}
