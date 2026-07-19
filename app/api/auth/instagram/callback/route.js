import { NextResponse } from "next/server"
import { cookies } from "next/headers"
const APP_ID = process.env.INSTAGRAM_APP_ID
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || "http://localhost:3000/api/auth/instagram/callback"
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  if (error || !code) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?instagram=error`)
  try {
    const tokenRes = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: APP_ID, client_secret: APP_SECRET, redirect_uri: REDIRECT_URI, code }),
    })
    const tokenData = await tokenRes.json()
    if (tokenData.error) throw new Error(tokenData.error.message)
    const shortToken = tokenData.access_token
    const longRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortToken}`)
    const longData = await longRes.json()
    const longToken = longData.access_token || shortToken
    const expiresIn = longData.expires_in || 5184000
    const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${longToken}`)
    const pagesData = await pagesRes.json()
    const pages = pagesData.data || []
    let igUserId = process.env.INSTAGRAM_USER_ID || "17841480004664319"
    let finalToken = longToken
    for (const page of pages) {
      const igRes = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`)
      const igData = await igRes.json()
      if (igData.instagram_business_account?.id) {
        igUserId = igData.instagram_business_account.id
        finalToken = page.access_token
        break
      }
    }
    const cookieStore = await cookies()
    const expiry = new Date(Date.now() + expiresIn * 1000)
    cookieStore.set("ig_access_token", finalToken, { httpOnly: true, expires: expiry, path: "/" })
    cookieStore.set("ig_user_id", igUserId, { httpOnly: true, expires: expiry, path: "/" })
    cookieStore.set("ig_connected", "true", { expires: expiry, path: "/" })
    cookieStore.set("ig_expiry", expiry.toISOString(), { expires: expiry, path: "/" })
    console.log("Instagram connected! User:", igUserId)
    return NextResponse.redirect("${process.env.NEXTAUTH_URL}/dashboard?instagram=connected")
  } catch (err) {
    console.error("Instagram callback error:", err.message)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?instagram=error&msg=${encodeURIComponent(err.message)}`)
  }
}
