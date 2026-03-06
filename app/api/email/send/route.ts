import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, type } = await request.json()

    if (!to) {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured - email will be logged only")
      console.log(`[EMAIL] To: ${to}, Subject: ${subject}, Type: ${type}`)
      return NextResponse.json({
        success: true,
        message: "Email logged (RESEND_API_KEY not configured)",
        logged: true
      })
    }

    const emailTemplates: Record<string, { subject: string; html: string }> = {
      "video-live": {
        subject: subject || "🎉 Your Video is Live on YouTube!",
        html: html || `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Video Published!</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;">Great news! Your video has been successfully uploaded to YouTube.</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
                <p style="margin: 0; color: #666;">Your video is now live and ready to be discovered by your audience!</p>
              </div>
              <a href="#" style="display: inline-block; background: #ff0000; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">View on YouTube</a>
              <p style="margin-top: 30px; font-size: 14px; color: #999;">Thank you for using YouTubeAuto.ai!</p>
            </div>
          </body>
          </html>
        `
      },
      "video-failed": {
        subject: subject || "❌ Video Upload Failed",
        html: html || `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); padding: 30px; border-radius: 12px; text-align: center;">
              <h1 style="color: white; margin: 0;">⚠️ Upload Issue</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;">Unfortunately, your video failed to upload to YouTube.</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
                <p style="margin: 0; color: #666;">Please check your YouTube connection and try again, or contact support.</p>
              </div>
              <a href="#" style="display: inline-block; background: #4a5568; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
              <p style="margin-top: 30px; font-size: 14px; color: #999;">Need help? Contact support@youtubeauto.ai</p>
            </div>
          </body>
          </html>
        `
      },
      "video-approved": {
        subject: subject || "✅ Your Video Has Been Approved!",
        html: html || `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 30px; border-radius: 12px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Video Approved!</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;">Your video has been approved and is being uploaded to YouTube.</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
                <p style="margin: 0; color: #666;">You'll receive another notification once the video is live!</p>
              </div>
              <p style="margin-top: 30px; font-size: 14px; color: #999;">Thank you for using YouTubeAuto.ai!</p>
            </div>
          </body>
          </html>
        `
      }
    }

    const template = emailTemplates[type] || emailTemplates["video-live"]

    const resend = getResendClient()
    if (!resend) {
      console.warn("Resend client could not be initialized")
      return NextResponse.json({ success: false, error: "Email service not configured" }, { status: 500 })
    }

    const data = await resend.emails.send({
      from: "YouTubeAuto.ai <onboarding@resend.dev>",
      to: [to],
      subject: subject || template.subject,
      html: html || template.html,
    })

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      data
    })
  } catch (error: any) {
    console.error("Email send error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    )
  }
}
