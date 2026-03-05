import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { topic, language, channelName, category } = await req.json()
    if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 })

    const scriptRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a YouTube script writer for a ${category || "General"} channel called "${channelName || "My Channel"}". Write in ${language || "Hindi"} language. Always respond with valid JSON only, no extra text. Make content engaging, viral, and YouTube algorithm friendly. Use trending hooks. Avoid copyrighted content.`
        },
        {
          role: "user",
          content: `Write a YouTube video script for topic: "${topic}". Follow YouTube algorithm best practices. Respond ONLY with this exact JSON format: {"title": "catchy title with numbers/power words", "script": "full engaging script", "description": "SEO optimized description with keywords", "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"], "hook": "first 5 seconds hook to retain viewers", "chapters": ["0:00 Intro", "1:00 Main Topic", "3:00 Conclusion"]}`
        }
      ],
      temperature: 0.8,
      max_tokens: 3000,
    })

    const raw = scriptRes.choices[0].message.content || ""
    const cleaned = raw.replace(/```json|```/g, "").replace(/[\x00-\x1F\x7F]/g, " ").trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found in response")
    const scriptData = JSON.parse(jsonMatch[0])

    // Generate thumbnail data
    const thumbRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `For YouTube thumbnail about "${scriptData.title}", give: bold text (max 4 words), bright bg color, emoji. JSON only: {"boldText": "...", "bgColor": "#...", "emoji": "..."}`
        }
      ],
      max_tokens: 100,
    })

    const thumbRaw = thumbRes.choices[0].message.content || ""
    const thumbCleaned = thumbRaw.replace(/```json|```/g, "").trim()
    const thumbMatch = thumbCleaned.match(/\{[\s\S]*\}/)
    const thumbData = thumbMatch ? JSON.parse(thumbMatch[0]) : { boldText: "MUST WATCH", bgColor: "#FF0000", emoji: "??" }

    return NextResponse.json({
      success: true,
      title: scriptData.title || "Untitled",
      script: scriptData.script || "",
      description: scriptData.description || "",
      tags: scriptData.tags || [],
      hook: scriptData.hook || "",
      chapters: scriptData.chapters || [],
      thumbnail: {
        boldText: thumbData.boldText,
        bgColor: thumbData.bgColor,
        emoji: thumbData.emoji,
      }
    })
  } catch (error: any) {
    console.error("Video generation error:", error)
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}
