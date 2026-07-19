import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// 🔥 Trim lagaya taaki env variables mein galti se aaye spaces Google ko na bheje
const CLIENT_ID     = (process.env.GOOGLE_CLIENT_ID || "").trim()
const CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || "").trim()
const REDIRECT_URI  = "https://youtubeautoaiproductdesign5.vercel.app/api/youtube/callback"

function getBaseUrl() {
  return "https://youtubeautoaiproductdesign5.vercel.app"
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(`${getBaseUrl()}/dashboard?youtube=error`)
  }

  try {
    // 🔥 Nuke: URLSearchParams object ki jagah toString() use kiya jisse format 100% perfect ho
    const bodyString = new URLSearchParams({
      code: code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }).toString()

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyString,
    })

    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error("YouTube Google Token API error:", tokenData)
      return NextResponse.redirect(
        `${getBaseUrl()}/dashboard?youtube=error&msg=${encodeURIComponent(tokenData.error_description || tokenData.error)}`
      )
    }

    const { access_token, refresh_token, expires_in } = tokenData
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
        expires:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        path:     "/",
        sameSite: "lax",
      })
    }

    cookieStore.set("yt_connected", "true", {
      expires:  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      path:     "/",
      sameSite: "lax",
    })

    console.log("YouTube connected successfully!")
    return NextResponse.redirect(`${getBaseUrl()}/dashboard?youtube=connected`)

  } catch (err) {
    console.error("YouTube callback fetch error:", err.message)
    return NextResponse.redirect(
      `${getBaseUrl()}/dashboard?youtube=error&msg=${encodeURIComponent(err.message)}`
    )
  }
}
