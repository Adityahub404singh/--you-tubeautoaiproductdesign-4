import { NextResponse } from "next/server"
import { cookies } from "next/headers"
export async function GET() {
  try {
    const cookieStore = await cookies()
    const connected = cookieStore.get("ig_connected")?.value === "true"
    const igUserId = cookieStore.get("ig_user_id")?.value
    const token = cookieStore.get("ig_access_token")?.value
    const expiry = cookieStore.get("ig_expiry")?.value
    if (!connected || !token) return NextResponse.json({ connected: false })
    if (expiry && new Date(expiry) < new Date()) return NextResponse.json({ connected: false, reason: "expired" })
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${igUserId}?fields=id,username,followers_count&access_token=${token}`)
      const info = await res.json()
      if (info.error) throw new Error(info.error.message)
      return NextResponse.json({ connected: true, igUserId, username: info.username, followers: info.followers_count, expiresAt: expiry })
    } catch { return NextResponse.json({ connected: false, reason: "token_invalid" }) }
  } catch (err) { return NextResponse.json({ connected: false, error: err.message }) }
}
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("ig_access_token")
  cookieStore.delete("ig_user_id")
  cookieStore.delete("ig_connected")
  cookieStore.delete("ig_expiry")
  return NextResponse.json({ success: true })
}
