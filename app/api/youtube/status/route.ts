import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getValidAccessToken } from "@/lib/youtube-token";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { accessToken } = await getValidAccessToken(cookieStore);

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
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { connected: false, error: "Unable to fetch YouTube channel details" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const channel = data.items?.[0];

    if (!channel) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
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
  } catch (error) {
    console.error("YouTube status error:", error);

    return NextResponse.json(
      { connected: false, error: "Failed to check YouTube connection" },
      { status: 500 }
    );
  }
}
