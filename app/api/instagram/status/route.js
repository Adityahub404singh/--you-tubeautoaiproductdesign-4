import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ig_access_token")?.value;
    const userId = cookieStore.get("ig_user_id")?.value;

    if (!token || !userId) {
      return NextResponse.json({ connected: false });
    }

    const params = new URLSearchParams({
      fields: "id,username,name,profile_picture_url,followers_count,media_count",
      access_token: token,
    });

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${encodeURIComponent(userId)}?${params.toString()}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Instagram Graph API error:", data.error);

      return NextResponse.json(
        {
          connected: false,
          error: data.error?.message ?? "Unable to fetch Instagram account",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      connected: true,
      platform: "instagram",
      accountId: data.id,
      channelName: data.name || data.username || "Instagram Account",
      username: data.username ? `@${data.username}` : null,
      avatarUrl: data.profile_picture_url ?? null,
      followers: Number(data.followers_count ?? 0),
      mediaCount: Number(data.media_count ?? 0),
    });
  } catch (error) {
    console.error("Instagram status error:", error);

    return NextResponse.json(
      { connected: false, error: "Failed to check Instagram connection" },
      { status: 500 }
    );
  }
}
