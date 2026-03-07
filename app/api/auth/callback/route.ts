import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  if (!code) return NextResponse.redirect(new URL("/dashboard?error=no_code", req.url))

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    })

    const data = await res.json()
    if (!data.access_token) throw new Error("No access token")

    const response = NextResponse.redirect(new URL("/dashboard?youtube=connected", req.url))
    response.cookies.set("youtube_access_token", data.access_token, {
      httpOnly: true, secure: false, maxAge: 3600, path: "/"
    })
    if (data.refresh_token) {
      response.cookies.set("youtube_refresh_token", data.refresh_token, {
        httpOnly: true, secure: false, maxAge: 60 * 60 * 24 * 30, path: "/"
      })
    }
    return response
  } catch (e: any) {
    return NextResponse.redirect(new URL("/dashboard?error=auth_failed", req.url))
  }
}
