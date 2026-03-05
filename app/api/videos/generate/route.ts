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
          content: `You are a YouTube script writer for a ${category} channel called "${channelName}". Write in ${language} language. Keep it engaging, 3-5 minutes long.`
        },
        {
          role: "user",
          content: `Write a complete YouTube video script for topic: "${topic}". Include: Hook, Introduction, Main Content (3 sections), and Call to Action. Also generate: Title, Description (150-300 words), and 10 Tags. Respond ONLY in JSON format: {"title": "...", "script": "...", "description": "...", "tags": ["tag1"], "hook": "..."}`
        }
      ]
    })

    const raw = scriptRes.choices[0].message.content || ""
    const cleaned = raw.replace(/```json|```/g, "").trim()
    const scriptData = JSON.parse(cleaned)

    return NextResponse.json({
      success: true,
      title: scriptData.title,
      script: scriptData.script,
      description: scriptData.description,
      tags: scriptData.tags,
      hook: scriptData.hook,
      thumbnailUrl: ""
    })
  } catch (error: any) {
    console.error("Video generation error:", error)
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}
