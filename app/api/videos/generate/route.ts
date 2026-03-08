import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

const CATEGORY_STYLES = {
  facts:      { bgColor: "#1a237e", accent: "#2196F3", emoji: "🧠", badge: "FACTS" },
  motivation: { bgColor: "#e65100", accent: "#FF9800", emoji: "💪", badge: "MOTIVATION" },
  tech:       { bgColor: "#1b5e20", accent: "#4CAF50", emoji: "🤖", badge: "TECH" },
  story:      { bgColor: "#4a148c", accent: "#9C27B0", emoji: "📖", badge: "STORY" },
  shorts:     { bgColor: "#b71c1c", accent: "#F44336", emoji: "⚡", badge: "SHORTS" },
  top10:      { bgColor: "#f57f17", accent: "#FFC107", emoji: "🏆", badge: "TOP 10" },
  general:    { bgColor: "#880000", accent: "#FF0000", emoji: "🔥", badge: "VIRAL" },
}

const CATEGORY_PROMPTS = {
  facts: `Write educational facts-based YouTube script. Include shocking/surprising facts. Use "Did you know?" hooks. Make it educational and entertaining.`,
  motivation: `Write powerful motivational YouTube script. Include real success stories, powerful quotes, actionable advice. Make viewers feel inspired and energized.`,
  tech: `Write tech/AI news YouTube script. Explain complex topics simply. Include latest developments, practical applications, future implications.`,
  story: `Write engaging story-format YouTube script. Build suspense, use vivid descriptions, emotional connection. Original story only, no copyrighted content.`,
  shorts: `Write punchy 60-second YouTube Shorts script. Hook in first 3 seconds, fast-paced, single key message, strong CTA at end.`,
  top10: `Write Top 10 countdown YouTube script. Start from 10, build excitement to #1. Each point must be surprising and interesting.`,
  general: `Write viral YouTube script. Trending topic, strong hook, engaging throughout, clear value for viewer.`,
}

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { topic, language, channelName, category, mode, generate30Day } = await req.json()
    if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 })

    const catKey = (category || "general").toLowerCase().replace(/\s+/g, "")
    const catStyle = CATEGORY_STYLES[catKey] || CATEGORY_STYLES.general
    const catPrompt = CATEGORY_PROMPTS[catKey] || CATEGORY_PROMPTS.general
    const isShorts = mode === "shorts" || catKey === "shorts"

    // 30-day schedule generate
    if (generate30Day) {
      const scheduleRes = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "user",
          content: `Generate 30 unique YouTube video topics for a ${category} channel in ${language} language about "${topic}". Mix different angles, perspectives and subtopics. Return JSON array only: [{"day": 1, "topic": "...", "type": "facts|motivation|tech|story|top10"}, ...]`
        }],
        temperature: 0.9,
        max_tokens: 2000,
      })
      const raw = scheduleRes.choices[0].message.content || ""
      const match = raw.replace(/```json|```/g, "").trim().match(/\[[\s\S]*\]/)
      const schedule = match ? JSON.parse(match[0]) : []
      return NextResponse.json({ success: true, schedule30Day: schedule })
    }

    // Script generate
    const scriptRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a viral YouTube script writer for "${channelName || "My Channel"}" channel. Write in ${language || "Hindi"} language. ${catPrompt} Always respond with valid JSON only. Make content 100% original - no copyrighted material.`
        },
        {
          role: "user",
          content: `Write a ${isShorts ? "60-second YouTube Shorts" : "5-7 minute YouTube"} video script for topic: "${topic}".
Respond ONLY with this JSON:
{
  "title": "catchy clickbait title with numbers/power words (max 60 chars)",
  "script": "full engaging script with natural pauses marked as [pause]",
  "description": "SEO description 200+ words with keywords",
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12","tag13","tag14","tag15"],
  "hook": "first 5 seconds hook sentence",
  "keyPoints": ["point1","point2","point3","point4","point5"],
  "callToAction": "subscribe/like CTA text",
  "pexelsQuery": "2-3 word search term for relevant stock video (English only)",
  "chapters": ["0:00 Intro","1:00 Main Topic","3:00 Conclusion"]
}`
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

    // Pexels se copyright-free clip search karo
    let pexelsClips: any[] = []
    const pexelsKey = process.env.PEXELS_API_KEY
    if (pexelsKey && scriptData.pexelsQuery) {
      try {
        const query = encodeURIComponent(scriptData.pexelsQuery || topic.slice(0, 30))
        const pexRes = await fetch(`https://api.pexels.com/videos/search?query=${query}&per_page=5&orientation=${isShorts ? "portrait" : "landscape"}`, {
          headers: { Authorization: pexelsKey }
        })
        if (pexRes.ok) {
          const pexData = await pexRes.json()
          pexelsClips = (pexData.videos || []).slice(0, 3).map((v: any) => ({
            id: v.id,
            url: v.video_files?.find((f: any) => f.quality === "sd")?.link || v.video_files?.[0]?.link,
            duration: v.duration,
            photographer: v.user?.name,
          }))
        }
      } catch (e) { console.log("Pexels fetch failed:", e) }
    }

    return NextResponse.json({
      success: true,
      title: scriptData.title || "Untitled",
      script: scriptData.script || "",
      description: scriptData.description || "",
      tags: scriptData.tags || [],
      hook: scriptData.hook || "",
      keyPoints: scriptData.keyPoints || [],
      callToAction: scriptData.callToAction || "",
      chapters: scriptData.chapters || [],
      pexelsQuery: scriptData.pexelsQuery || "",
      pexelsClips,
      category: catKey,
      isShorts,
      thumbnail: {
        boldText: scriptData.title?.split(" ").slice(0, 4).join(" ") || "MUST WATCH",
        bgColor: catStyle.bgColor,
        accent: catStyle.accent,
        emoji: catStyle.emoji,
        badge: catStyle.badge,
      }
    })
  } catch (error: any) {
    console.error("Video generation error:", error)
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}
