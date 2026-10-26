
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getValidAccessToken } from "@/lib/youtube-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const {
      accessToken,
      newToken,
      expiresIn,
    } = await getValidAccessToken(cookieStore);

    if (!accessToken) {
      return NextResponse.json({ connected: false });
    }

    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      console.error("[YOUTUBE STATUS] API request failed:", response.status);

      return NextResponse.json(
        {
          connected: false,
          error: "Unable to fetch YouTube channel details",
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const channel = data.items?.[0];

    if (!channel) {
      return NextResponse.json({ connected: false });
    }

    const result = NextResponse.json({
      connected: true,
      platform: "youtube",
      channelId: channel.id,
      channelName: channel.snippet?.title ?? "YouTube Channel",
      username: channel.snippet?.customUrl
        ? `@${channel.snippet.customUrl.replace(/^@/, "")}`
        : null,
      avatarUrl:
        channel.snippet?.thumbnails?.high?.url ??
        channel.snippet?.thumbnails?.default?.url ??
        null,
      subscribers: Number(channel.statistics?.subscriberCount ?? 0),
      videoCount: Number(channel.statistics?.videoCount ?? 0),
    });

    // Persist a newly refreshed access token in the browser cookie.
    if (newToken) {
      result.cookies.set("yt_access_token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: Math.max(60, Number(expiresIn ?? 3600) - 60),
      });
    }

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    console.error("[YOUTUBE STATUS ERROR]", message);

    if (message === "NOT_CONNECTED") {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json(
      {
        connected: false,
        error: "Failed to check YouTube connection",
      },
      { status: 500 }
    );
  }
}
