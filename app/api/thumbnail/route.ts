import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { createCanvas } from "canvas"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const { topic, title, boldText, bgColor, emoji } = await req.json()

    let thumbBoldText = boldText
    let thumbBgColor = bgColor
    let thumbEmoji = emoji

    // Agar data nahi hai toh Groq se lo
    if (!thumbBoldText) {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: `For YouTube thumbnail about "${title || topic}", give bold text (max 4 words), bright bg color hex, emoji. JSON only: {"boldText": "...", "bgColor": "#...", "emoji": "..."}` }],
        max_tokens: 100,
      })
      const raw = res.choices[0].message.content || ""
      const match = raw.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/)
      const data = match ? JSON.parse(match[0]) : { boldText: "MUST WATCH", bgColor: "#FF0000", emoji: "🔥" }
      thumbBoldText = data.boldText
      thumbBgColor = data.bgColor
      thumbEmoji = data.emoji
    }

    // Canvas se image banao
    const canvas = createCanvas(1280, 720)
    const ctx = canvas.getContext("2d")
    const W = 1280, H = 720

    // Background
    ctx.fillStyle = thumbBgColor || "#FF0000"
    ctx.fillRect(0, 0, W, H)

    // Dark overlay
    const gradient = ctx.createLinearGradient(0, 0, W, 0)
    gradient.addColorStop(0, "rgba(0,0,0,0.8)")
    gradient.addColorStop(1, "rgba(0,0,0,0.2)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, W, H)

    // Red left bar
    ctx.fillStyle = "#FF0000"
    ctx.fillRect(0, 0, 12, H)

    // VIRAL badge
    ctx.fillStyle = "#FF0000"
    ctx.fillRect(50, 80, 120, 40)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 22px Arial"
    ctx.fillText("VIRAL", 65, 108)

    // Bold text
    ctx.fillStyle = "#FFFFFF"
    ctx.shadowColor = "rgba(0,0,0,0.8)"
    ctx.shadowBlur = 15
    ctx.font = "bold 72px Arial"
    const words = (thumbBoldText || title || "MUST WATCH").toUpperCase().split(" ")
    let line = "", y = 200
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + " "
      if (ctx.measureText(test).width > 700 && i > 0) {
        ctx.fillText(line.trim(), 50, y)
        line = words[i] + " "
        y += 85
      } else { line = test }
    }
    ctx.fillText(line.trim(), 50, y)

    // Emoji
    ctx.font = "120px Arial"
    ctx.fillText(thumbEmoji || "🔥", W - 200, H / 2 + 60)

    // YouTube logo area
    ctx.fillStyle = "#FF0000"
    ctx.fillRect(W - 160, H - 60, 130, 42)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 20px Arial"
    ctx.textAlign = "center"
    ctx.fillText("YouTube", W - 95, H - 30)

    // Save to file
    const thumbDir = path.join(process.cwd(), "storage", "thumbnails")
    if (!existsSync(thumbDir)) await mkdir(thumbDir, { recursive: true })
    const fileName = `thumb_${Date.now()}.jpg`
    const filePath = path.join(thumbDir, fileName)
    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.9 })
    await writeFile(filePath, buffer)

    const thumbnailUrl = `/storage/thumbnails/${fileName}`

    return NextResponse.json({
      success: true,
      boldText: thumbBoldText,
      bgColor: thumbBgColor,
      emoji: thumbEmoji,
      title: title || topic,
      url: thumbnailUrl,
      thumbnailUrl,
    })
  } catch (error: any) {
    console.error("Thumbnail error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
