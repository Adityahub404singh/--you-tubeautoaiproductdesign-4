import { NextRequest, NextResponse } from "next/server"

// Note: Video upload is handled client-side in video-approval-list.tsx
// because IndexedDB (where video files are stored) is only available in the browser.
// This route is kept as a fallback for future server-side upload support.

export async function POST(request: NextRequest) {
  try {
    const { accessToken, title, description, tags, categoryId, privacyStatus } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing required field: accessToken" },
        { status: 400 }
      )
    }

    // Video upload is handled client-side. This route is a placeholder.
    return NextResponse.json(
      { error: "Video upload must be done client-side. Use the upload form or admin approval flow." },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("Auto-upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload video" },
      { status: 500 }
    )
  }
}

