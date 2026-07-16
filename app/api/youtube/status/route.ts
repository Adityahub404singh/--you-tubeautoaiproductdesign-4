import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getValidAccessToken } from "@/lib/youtube-token";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const result = await getValidAccessToken(cookieStore);
    
    // Agar getValidAccessToken fail nahi hua, matlab connected hai
    return NextResponse.json({ 
      connected: true, 
      channelName: "Your YouTube Channel" // Isko baad mein fetch kar sakte hain
    });
  } catch (error) {
    return NextResponse.json({ connected: false });
  }
}
