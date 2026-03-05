import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { topic, title, category } = await req.json()

    // Get thumbnail text suggestions from Groq
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `For a YouTube thumbnail about "${title || topic}", suggest: 1) A short bold text (max 4 words), 2) A background color hex code (bright, eye-catching), 3) An emoji that fits. Respond ONLY in JSON: {"boldText": "...", "bgColor": "#...", "emoji": "..."}`
        }
      ],
      max_tokens: 100,
    })

    const raw = res.choices[0].message.content || ""
    const cleaned = raw.replace(/```json|```/g, "").trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    const data = match ? JSON.parse(match[0]) : { boldText: "MUST WATCH", bgColor: "#FF0000", emoji: "??" }

    return NextResponse.json({
      success: true,
      boldText: data.boldText,
      bgColor: data.bgColor,
      emoji: data.emoji,
      title: title || topic,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
