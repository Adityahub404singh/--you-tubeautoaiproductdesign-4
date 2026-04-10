import { NextResponse } from "next/server"
export async function GET() {
  const appId = process.env.INSTAGRAM_APP_ID
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || "http://localhost:3000/api/auth/instagram/callback"
  const scope = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management"
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=instagram_connect`
  return NextResponse.redirect(authUrl)
}
