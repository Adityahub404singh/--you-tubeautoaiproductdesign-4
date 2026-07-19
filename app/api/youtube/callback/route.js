import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI  = process.env.GOOGLE_OAUTH_REDIRECT_URI

// ✅ FIX: Use NEXTAUTH_URL instead of hardcoded localhost
function getBaseUrl() {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(`${getBaseUrl()}/dashboard?youtube=error`)
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        grant_type:    "authorization_code",
      }),
    })

    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error("YouTube token error:", tokenData.error)
      return NextResponse.redirect(
        `${getBaseUrl()}/dashboard?youtube=error&msg=${encodeURIComponent(tokenData.error_description || tokenData.error)}`
      )
    }

    const { access_token, refresh_token, expires_in } = tokenData

    // Save tokens in cookies
    const cookieStore = await cookies()
    const expiry = new Date(Date.now() + (expires_in || 3600) * 1000)

    cookieStore.set("yt_access_token", access_token, {
      httpOnly: true,
      expires:  expiry,
      path:     "/",
      sameSite: "lax",
    })

    if (refresh_token) {
      cookieStore.set("yt_refresh_token", refresh_token, {
        httpOnly: true,
        expires:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        path:     "/",
        sameSite: "lax",
      })
    }

    cookieStore.set("yt_connected", "true", {
      expires:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      path:     "/",
      sameSite: "lax",
    })

    console.log("YouTube connected!")

    // ✅ FIX: No hardcoded localhost
    return NextResponse.redirect(`${getBaseUrl()}/dashboard?youtube=connected`)

  } catch (err) {
    console.error("YouTube callback error:", err.message)
    return NextResponse.redirect(
      `${getBaseUrl()}/dashboard?youtube=error&msg=${encodeURIComponent(err.message)}`
    )
  }
}
