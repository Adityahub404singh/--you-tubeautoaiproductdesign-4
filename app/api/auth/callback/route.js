import { NextResponse } from "next/server"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) return NextResponse.redirect(`${process.env.APP_URL}/dashboard?youtube=denied`)
  if (!code) return NextResponse.redirect(`${process.env.APP_URL}/dashboard?youtube=error`)

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    })

    const tokens = await tokenResponse.json()
    console.log("YouTube tokens:", tokens.access_token ? "✅ Got token" : "❌ " + tokens.error)

    if (tokens.error) return NextResponse.redirect(`${process.env.APP_URL}/dashboard?youtube=token_error`)

    const response = NextResponse.redirect(`${process.env.APP_URL}/dashboard/channels?youtube=connected`)
    response.cookies.set("yt_access_token", tokens.access_token, {
      httpOnly: true, maxAge: tokens.expires_in || 3600, path: "/", sameSite: "lax"
    })
    if (tokens.refresh_token) {
      response.cookies.set("yt_refresh_token", tokens.refresh_token, {
        httpOnly: true, maxAge: 2592000, path: "/", sameSite: "lax"
      })
      console.log("✅ Refresh token saved!")
    } else {
      console.log("⚠️ No refresh token - revoke access and reconnect")
    }
    return response
  } catch (err) {
    console.error("Auth callback error:", err)
    return NextResponse.redirect(`${process.env.APP_URL}/dashboard?youtube=error`)
  }
}
