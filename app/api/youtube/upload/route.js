import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getValidAccessToken } from "@/lib/youtube-token";
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    let accessToken;
    try {
      const result = await getValidAccessToken(cookieStore);
      accessToken = result.accessToken;
    } catch (err) {
      if (err.message === "NOT_CONNECTED") return NextResponse.json({ error: "YouTube connected nahi hai" }, { status: 401 });
      throw err;
    }
    const { videoUrl, title, description, tags, categoryId, privacyStatus, scheduledTime, thumbnailUrl, language } = await request.json();
    if (!videoUrl || !title) return NextResponse.json({ error: "videoUrl aur title required hain" }, { status: 400 });
    const videoMetadata = {
      snippet: { title: title.slice(0, 100), description: (description || "") + "\n\n⚠️ Educational purposes only.\n\n#shorts #viral #trending", tags: tags?.slice(0, 15) || [], categoryId: categoryId || "22", defaultLanguage: language || "hi" },
      status: { privacyStatus: privacyStatus || "private", selfDeclaredMadeForKids: false },
    };
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) throw new Error("Video fetch failed");
    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBytes = new Uint8Array(videoBuffer);
    const initResponse = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Upload-Content-Type": "video/*", "X-Upload-Content-Length": videoBytes.length.toString() },
      body: JSON.stringify(videoMetadata),
    });
    if (!initResponse.ok) { const e = await initResponse.json(); throw new Error(JSON.stringify(e)); }
    const uploadUrl = initResponse.headers.get("Location");
    const uploadResponse = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "video/*", "Content-Length": videoBytes.length.toString() }, body: videoBytes });
    if (!uploadResponse.ok) throw new Error("Upload failed");
    const uploaded = await uploadResponse.json();
    return NextResponse.json({ success: true, videoId: uploaded.id, youtubeUrl: `https://www.youtube.com/watch?v=${uploaded.id}`, status: uploaded.status?.privacyStatus });
  } catch (error) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}

