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
          content: `You are a YouTube script writer for a ${category || "General"} channel called "${channelName || "My Channel"}". Write in ${language || "English"} language. Always respond with valid JSON only, no extra text.`
        },
        {
          role: "user",
          content: `Write a YouTube video script for topic: "${topic}". Respond ONLY with this exact JSON format, no markdown, no extra text: {"title": "video title here", "script": "full script here", "description": "description here", "tags": ["tag1", "tag2"], "hook": "hook here"}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const raw = scriptRes.choices[0].message.content || ""
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/[\x00-\x1F\x7F]/g, " ")
      .trim()

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found in response")
    
    const scriptData = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      title: scriptData.title || "Untitled",
      script: scriptData.script || "",
      description: scriptData.description || "",
      tags: scriptData.tags || [],
      hook: scriptData.hook || "",
      thumbnailUrl: ""
    })
  } catch (error: any) {
    console.error("Video generation error:", error)
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}
