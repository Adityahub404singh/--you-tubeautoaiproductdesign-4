import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Case 1: dataUrl save karo (admin approval flow)
    if (body.dataUrl && body.videoId) {
      const base64 = body.dataUrl.replace(/^data:image\/\w+;base64,/, "")
      const buffer = Buffer.from(base64, "base64")
      const dir = path.join(process.cwd(), "storage", "thumbnails")
      if (!existsSync(dir)) await mkdir(dir, { recursive: true })
      const filename = `thumb_${body.videoId}.jpg`
      const filepath = path.join(dir, filename)
      await writeFile(filepath, buffer)
      return NextResponse.json({ success: true, url: `/storage/thumbnails/${filename}` })
    }

    // Case 2: AI se thumbnail data generate karo (new-prompt flow)
    const { topic, title, boldText, bgColor, emoji } = body
    if (!topic && !title) return NextResponse.json({ error: "topic ya dataUrl required" }, { status: 400 })

    let thumbBoldText = boldText
    let thumbBgColor = bgColor || "#FF0000"
    let thumbEmoji = emoji || "🔥"

    if (!thumbBoldText) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
        const res = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: `For YouTube thumbnail about "${title || topic}", give bold text (max 4 words), bright bg color, emoji. JSON only: {"boldText": "...", "bgColor": "#...", "emoji": "..."}` }],
          max_tokens: 100,
        })
        const raw = res.choices[0].message.content || ""
        const match = raw.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/)
        if (match) {
          const data = JSON.parse(match[0])
          thumbBoldText = (data.boldText || "MUST WATCH").replace(/\*\*/g, "")
          thumbBgColor = data.bgColor || "#FF0000"
          thumbEmoji = data.emoji || "🔥"
        }
      } catch (e) {
        thumbBoldText = "MUST WATCH"
      }
    }

    return NextResponse.json({
      success: true,
      boldText: thumbBoldText,
      bgColor: thumbBgColor,
      emoji: thumbEmoji,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}