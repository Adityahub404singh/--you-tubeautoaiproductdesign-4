import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getValidAccessToken } from "@/lib/youtube-token";
export async function GET() {
  try {
    const cookieStore = await cookies();
    let accessToken;
    try {
      const result = await getValidAccessToken(cookieStore);
      accessToken = result.accessToken;
    } catch { return NextResponse.json({ connected: false }); }
    const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return NextResponse.json({ connected: false });
    const data = await response.json();
    const channel = data.items?.[0];
    if (!channel) return NextResponse.json({ connected: true, hasChannel: false });
    return NextResponse.json({
      connected: true, hasChannel: true,
      channel: { id: channel.id, name: channel.snippet?.title, thumbnail: channel.snippet?.thumbnails?.default?.url, subscribers: channel.statistics?.subscriberCount, totalVideos: channel.statistics?.videoCount },
    });
  } catch (error) { return NextResponse.json({ connected: false }); }
}

