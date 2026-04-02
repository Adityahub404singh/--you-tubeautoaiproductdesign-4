import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { videoPath, caption, igAccountId, accessToken } = await request.json();

    if (!videoPath || !igAccountId || !accessToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const videoUrl = request.headers.get("origin") + videoPath;

    // Step 1: Create container
    const containerRes = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "REELS",
          video_url: videoUrl,
          caption: caption || "Check out this amazing content! #viral #trending",
          access_token: accessToken,
        }),
      }
    );
    const container = await containerRes.json();

    if (container.error) {
      throw new Error(container.error.message);
    }

    // Step 2: Publish
    const publishRes = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: accessToken,
        }),
      }
    );
    const published = await publishRes.json();

    if (published.error) {
      throw new Error(published.error.message);
    }

    return NextResponse.json({
      success: true,
      instagramPostId: published.id,
      message: "Posted to Instagram!",
    });
  } catch (error) {
    console.error("Instagram upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
