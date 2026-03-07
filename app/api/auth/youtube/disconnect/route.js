import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export async function POST() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get("yt_access_token")?.value;
  if (accessToken) await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, { method: "POST" }).catch(() => {});
  const response = NextResponse.json({ success: true });
  response.cookies.delete("yt_access_token");
  response.cookies.delete("yt_refresh_token");
  return response;
}
