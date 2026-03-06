import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json()

    if (!to) {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        mode: "no-key",
        message: "RESEND_API_KEY is not configured in .env.local. Emails will be logged to console only.",
        logged: true,
        instructions: [
          "1. Go to https://resend.com and sign up (free)",
          "2. Go to API Keys section",
          "3. Click 'Create API Key'",
          "4. Copy the key (starts with re_)",
          "5. Paste it in .env.local: RESEND_API_KEY=re_your_key_here",
          "6. Restart the dev server (Ctrl+C then pnpm dev)",
          "7. Come back and test again",
        ],
      })
    }

    const resend = new Resend(apiKey)

    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🧪 Test Email</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0;">YouTubeAuto.ai Email System</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #333;">✅ Your email notifications are working correctly!</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
            <p style="margin: 0 0 10px; color: #333; font-weight: bold;">What this means:</p>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li>When admin approves your video → you'll get an email</li>
              <li>When video goes live on YouTube → you'll get an email</li>
              <li>When upload fails → you'll get an email with error details</li>
            </ul>
          </div>
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2e7d32; font-size: 14px;">
              <strong>Sent at:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
            </p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
          <p style="margin-top: 30px; font-size: 14px; color: #999;">YouTubeAuto.ai — AI-Powered Video Automation</p>
        </div>
      </body>
      </html>
    `

    const data = await resend.emails.send({
      from: "YouTubeAuto.ai <onboarding@resend.dev>",
      to: [to],
      subject: "🧪 Test Email — YouTubeAuto.ai Notifications Working!",
      html: testHtml,
    })

    return NextResponse.json({
      success: true,
      mode: "live",
      message: `Test email sent to ${to}! Check your inbox (and spam folder).`,
      data,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to send test email"
    console.error("Test email error:", error)
    return NextResponse.json(
      {
        success: false,
        mode: "error",
        error: errorMessage,
        hint: "Make sure your RESEND_API_KEY is correct and valid.",
      },
      { status: 500 }
    )
  }
}
