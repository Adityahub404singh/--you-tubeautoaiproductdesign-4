import { cookies } from "next/headers"

export async function getValidAccessToken(cookieStore: any) {
  const accessToken = cookieStore.get("youtube_access_token")?.value
  const refreshToken = cookieStore.get("youtube_refresh_token")?.value

  if (!accessToken && !refreshToken) {
    throw new Error("NOT_CONNECTED")
  }

  if (accessToken) {
    return { accessToken }
  }

  // Refresh token use karo
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken!,
      grant_type: "refresh_token",
    }),
  })

  const data = await res.json()
  if (!data.access_token) throw new Error("Token refresh failed")

  return { accessToken: data.access_token }
}
