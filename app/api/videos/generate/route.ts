import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

// ============================================================
// CATEGORY SYSTEM - Pro viral content per category
// ============================================================
const CATEGORY_CONFIG: Record<string, any> = {
  facts: {
    systemPrompt: `You are India's #1 viral facts YouTuber. Your style: shocking, mind-blowing, educational.
Rules:
- Start with "Kya aap jaante hain" or shocking statement
- Use simple Hindi everyone understands
- Each fact must be MORE shocking than previous
- Short sentences. Maximum 8 words per sentence.
- Add "[PAUSE]" after every 2-3 sentences for natural breathing
- End with "Aisa hi ek aur video dekhne ke liye abhi subscribe karo!"`,
    pexelsQueries: ["space galaxy nebula cinematic", "science laboratory neon blue", "ancient ruins mystery fog", "underwater bioluminescent ocean", "brain neurons glowing purple"],
    voiceRate: "+10%",
    voicePitch: "+2Hz",
    voice: "hi-IN-MadhurNeural",
    musicMood: "ethereal mysterious",
  },
  motivation: {
    systemPrompt: `You are Sandeep Maheshwari of YouTube. Your style: emotional, powerful, life-changing.
Rules:
- Open with a painful truth or inspiring story hook
- Build emotional connection slowly
- Use real-life examples from India
- Short punchy sentences. Maximum 7 words.
- Add "[PAUSE]" at emotional moments
- End with powerful CTA that feels like a reward`,
    pexelsQueries: ["athlete sunrise mountain epic", "champion victory celebration", "hustle grind entrepreneur desk", "eagle flying freedom clouds", "fire determination spirit"],
    voiceRate: "+3%",
    voicePitch: "-2Hz",
    voice: "hi-IN-MadhurNeural",
    musicMood: "epic orchestral emotional",
  },
  tech: {
    systemPrompt: `You are Technical Guruji meets Dhruv Rathee. Your style: clear, exciting, practical.
Rules:
- Explain complex tech in class 8 student language
- Use Indian examples and comparisons
- Make technology sound exciting and urgent
- Short sentences. No jargon without explanation.
- Add "[PAUSE]" between key points
- End with practical tip viewers can use TODAY`,
    pexelsQueries: ["holographic AI robot neon", "cyberpunk city night lights", "coding screen dark room", "futuristic technology blue", "data visualization 3d"],
    voiceRate: "+8%",
    voicePitch: "+0Hz",
    voice: "hi-IN-MadhurNeural",
    musicMood: "synthwave electronic beat",
  },
  story: {
    systemPrompt: `You are India's best horror/mystery storyteller. Your style: suspenseful, cinematic, gripping.
Rules:
- Start IN the middle of the action (in medias res)
- Build tension slowly with vivid descriptions
- Use sensory details: sounds, smells, feelings
- Short dramatic sentences. Sometimes ONE word sentences for impact.
- Add "[PAUSE]" at scary/tense moments
- Leave a twist ending that makes viewers share`,
    pexelsQueries: ["dark forest fog night", "abandoned house mystery", "rainy window cinematic noir", "dramatic storm lightning", "shadows mystery thriller"],
    voiceRate: "-15%",
    voicePitch: "-5Hz",
    voice: "hi-IN-SwaraNeural",
    musicMood: "dark cinematic suspense",
  },
  top10: {
    systemPrompt: `You are India's top countdown creator. Your style: exciting, dramatic, surprising reveals.
Rules:
- Start with "Aaj main aapko bataunga Top 10..."
- Count DOWN from 10 to 1
- Each item must be MORE surprising than previous
- Build excitement as you approach #1
- Add "[PAUSE]" before each reveal for drama
- #1 must be absolutely shocking/unexpected`,
    pexelsQueries: ["luxury lifestyle wealth success", "world landmarks iconic", "award trophy winner ceremony", "countdown explosion fireworks", "dramatic reveal spotlight"],
    voiceRate: "+12%",
    voicePitch: "+3Hz",
    voice: "hi-IN-MadhurNeural",
    musicMood: "hype countdown building",
  },
  shorts: {
    systemPrompt: `You are India's #1 viral Shorts creator. Your style: FAST, punchy, addictive.
Rules:
- Hook in FIRST 2 WORDS - make them stop scrolling
- Total script: maximum 45 seconds when read aloud
- ONE clear message or emotion
- Every sentence must earn its place
- Add "[PAUSE]" only once for maximum impact
- End with a question that makes them comment`,
    pexelsQueries: ["viral energy explosion fast", "social media lifestyle trendy", "street urban aesthetic night", "quick motion dynamic sport", "neon aesthetic cool"],
    voiceRate: "+20%",
    voicePitch: "+4Hz",
    voice: "hi-IN-SwaraNeural",
    musicMood: "trap beat drop energy",
  },
  horror: {
    systemPrompt: `You are India's scariest horror content creator. Your style: terrifying, psychological, real-feeling.
Rules:
- Make it feel like a TRUE story from India
- Use specific Indian locations (Delhi metro, old haveli, Rajasthan desert, Mumbai local)
- Build dread slowly, never rush the scare
- Use silence and pauses as weapons
- Add "[PAUSE]" before every scary moment
- End with a chill-inducing twist that makes them share`,
    pexelsQueries: ["haunted house dark fog", "horror shadows empty room", "graveyard night misty", "old corridor dark light", "scary forest night"],
    voiceRate: "-25%",
    voicePitch: "-12Hz",
    voice: "hi-IN-SwaraNeural",
    musicMood: "horror ambient eerie",
  },
  finance: {
    systemPrompt: `You are India's most trusted personal finance educator. Your style: practical, urgent, eye-opening.
Rules:
- Start with a money mistake most Indians make
- Use real rupee amounts (not dollars)
- Simple language, no complex terms without explanation
- Make every tip actionable TODAY
- Add "[PAUSE]" after important numbers/facts
- End with one action they can take in next 5 minutes`,
    pexelsQueries: ["money rupees wealth india", "stock market growth chart", "savings investment gold", "business success entrepreneur india", "financial freedom lifestyle"],
    voiceRate: "+6%",
    voicePitch: "+1Hz",
    voice: "hi-IN-MadhurNeural",
    musicMood: "corporate professional upbeat",
  },
  health: {
    systemPrompt: `You are India's most trusted health & wellness creator. Your style: caring, scientific, practical.
Rules:
- Start with a health fact that surprises Indians
- Use Ayurveda + modern science mix
- Reference dadi ke nuskhe where relevant
- Simple actionable tips, no doctor jargon
- Add "[PAUSE]" after important health warnings
- End with one healthy habit to start today`,
    pexelsQueries: ["yoga sunrise india wellness", "healthy food vegetables colorful", "meditation peace calm nature", "fitness workout energy", "ayurveda herbs natural healing"],
    voiceRate: "+4%",
    voicePitch: "+2Hz",
    voice: "hi-IN-SwaraNeural",
    musicMood: "calm peaceful nature sounds",
  },
  general: {
    systemPrompt: `You are India's most versatile viral content creator. Your style: engaging, relatable, shareable.
Rules:
- Start with something every Indian can relate to
- Mix humor with information
- Use simple Hindi with occasional English words
- Short sentences for mobile viewers
- Add "[PAUSE]" for natural rhythm
- End with strong share-worthy CTA`,
    pexelsQueries: ["cinematic aerial drone sunset", "epic India landscape", "urban city timelapse", "beautiful nature light", "dramatic sky clouds"],
    voiceRate: "+6%",
    voicePitch: "+0Hz",
    voice: "hi-IN-MadhurNeural",
    musicMood: "cinematic emotional",
  },
}

// ============================================================
// HOOK TEMPLATES - Proven viral openers (FIXED encoding)
// ============================================================
const HOOKS: Record<string, string[]> = {
  facts: [
    "Ye fact sunke aapka dimaag ghoom jayega,",
    "99% log ye nahi jaante,",
    "Science ne abhi ye bata diya,",
    "Ye secret aaj tak kisi ne nahi bataya,",
    "Aaj ek aisi baat bataunga jo aap sochte bhi nahi,",
  ],
  motivation: [
    "Ek insaan ne sab kuch khokar bhi wapas aaya,",
    "Haar se 1 kadam pehle mat rukna,",
    "Duniya ne kaha impossible, usne kar dikhaya,",
    "Aaj ki ye kahani aapki zindagi badal degi,",
    "Woh raat jab sab kuch khatam lag raha tha,",
  ],
  tech: [
    "Ye AI tool aapki naukri khatam kar sakta hai,",
    "ChatGPT se bhi powerful tool aa gaya India mein,",
    "2025 ka sabse bada tech secret reveal ho gaya,",
    "Ye ek app aapke 10000 rupaye bachayegi,",
    "Abhi jo technology aayi hai, usse sab dar rahe hain,",
  ],
  story: [
    "Raat ke 3 baje jab main akela tha,",
    "Usne door se jo dekha, woh aaj bhi yaad hai,",
    "Log kehte hain ye sach nahi hua, par main jaanta hoon,",
    "Us raat ke baad, woh kabhi wahan nahi gaya,",
    "Meri dadi ne marne se pehle ye raaz bataya,",
  ],
  top10: [
    "Top 10 aisi cheezein jo aap bilkul nahi jaante,",
    "Ye 10 facts sunke aap soch mein pad jaoge,",
    "India ki 10 sabse shocking secrets,",
    "Top 10 log jo sach mein superhuman hain,",
    "10 aise kaam jo aaj se hi band karo,",
  ],
  shorts: [
    "Ye dekho,",
    "Suno ek minute,",
    "Ye trick kisi ne nahi batai,",
    "Aaj ka fact,",
    "Ye jaanna zaroori hai,",
  ],
  horror: [
    "Ye sacchi kahani hai, main guarantee deta hoon,",
    "Mere saath jo hua, woh main bhool nahi sakta,",
    "Us ghar mein abhi bhi koi rehta hai,",
    "Police ne case file band kar di, par sach kya tha,",
    "Aaj bhi woh awaaz aati hai raat ko,",
  ],
  finance: [
    "Ye ek galti aapko garib rakh sakti hai,",
    "Har Indian ye paisa barbad kar raha hai,",
    "Ye simple trick se 1 lakh rupaye bachao,",
    "Bank aapko ye kabhi nahi batayega,",
    "Sirf 500 rupaye se crorepati ban sakte hain,",
  ],
  health: [
    "Ye ek cheez subah khao, bimari kabhi nahi aayegi,",
    "Doctors ye isliye nahi batate,",
    "Dadi ka ye nuskha science ne bhi mana,",
    "Ye ek habit aapki umar 10 saal badha degi,",
    "Har raat ye karo, subah naya insaan banoge,",
  ],
  general: [
    "Ye baat aaj sabko jaanni chahiye,",
    "Aisa kya hai jo India mein sab karte hain,",
    "Ek simple cheez jo life badal deti hai,",
    "Aaj kuch aisa bataunga jo aap sochte nahi,",
    "India mein ye trend ab sab kar rahe hain,",
  ],
}

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { topic, language, channelName, category, mode, generate30Day } = await req.json()
    if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 })

    const catKey = (category || "general").toLowerCase().replace(/\s+/g, "")
    const config = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.general
    const isShorts = mode === "shorts" || catKey === "shorts" || catKey === "horror"
    const lang = language || "Hindi"
    const channel = channelName || "My Channel"

    // Pick random hook
    const hooks = HOOKS[catKey] || HOOKS.general
    const randomHook = hooks[Math.floor(Math.random() * hooks.length)]

    // 30-day schedule
    if (generate30Day) {
      const scheduleRes = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "user",
          content: `Generate 30 unique YouTube video topics for "${topic}" in ${lang} language.
Category: ${catKey}
Rules:
- Each topic completely different angle
- Mix of: shocking facts, emotional stories, top10 lists, how-to guides
- All highly searchable in India
- Include specific numbers when possible (e.g., "5 aise secrets...")
Return JSON array ONLY: [{"day": 1, "topic": "...", "type": "facts|story|top10|motivation|shorts", "hook": "opening line in Hindi"}]`
        }],
        temperature: 0.95,
        max_tokens: 2500,
      })
      const raw = scheduleRes.choices[0].message.content || ""
      const match = raw.replace(/```json|```/g, "").trim().match(/\[[\s\S]*\]/)
      const schedule = match ? JSON.parse(match[0]) : []
      return NextResponse.json({ success: true, schedule30Day: schedule })
    }

    // Main script generation
    const scriptRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `${config.systemPrompt}

Channel: "${channel}" | Language: ${lang} | Style: ${catKey}

CRITICAL VOICE RULES:
- Write EXACTLY as it should be spoken aloud
- Use "[PAUSE]" for 1-2 second pauses (at commas, full stops, dramatic moments)
- NEVER use markdown, bullet points, or symbols in script
- NEVER use em-dashes (--), asterisks (*), or special characters
- NEVER use Unicode arrows, bullets, or decorative symbols
- Pure spoken Hindi/Hinglish only
- Each line maximum 10 words for clarity
- Total spoken duration: ${isShorts ? "30-45 seconds" : "4-6 minutes"}
- NO emojis in script field

RESPOND WITH VALID JSON ONLY - no markdown, no extra text before or after`
        },
        {
          role: "user",
          content: `Create a complete ${isShorts ? "YouTube Shorts (30-45 sec)" : "YouTube video (4-6 min)"} for:
"${topic}"

Start the script with this exact hook: "${randomHook}"

Return this exact JSON structure:
{
  "title": "Clickbait title in ${lang}, max 60 chars, with numbers/power words, NO special chars",
  "hook": "${randomHook}",
  "script": "Complete spoken script in ${lang}. Use [PAUSE] for breathing pauses. No dashes, no bullets, no symbols. Natural speech only.",
  "description": "SEO description 200+ words in ${lang} with keywords, what viewers learn, CTA. End with hashtags.",
  "keyPoints": ["point 1 in ${lang}", "point 2", "point 3", "point 4", "point 5"],
  "callToAction": "Subscribe/like/comment CTA in ${lang}",
  "pexelsQuery": "3-4 specific English words for stock footage search",
  "thumbnailText": "MAX 4 WORDS ALL CAPS NO SPECIAL CHARS",
  "thumbnailEmoji": "1 relevant emoji like fire or rocket",
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10"],
  "chapters": ["0:00 - Intro","1:00 - Main Point","4:00 - Conclusion"],
  "videoMood": "energetic"
}`
        }
      ],
      temperature: 0.85,
      max_tokens: 4000,
    })

    const raw = scriptRes.choices[0].message.content || ""
    const cleaned = raw.replace(/```json|```/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in AI response")
    const scriptData = JSON.parse(jsonMatch[0])

    // Deep clean all string fields
    const cleanField = (s: string) => (s || "")
      .replace(/\u2014|\u2013|—|–/g, ", ")   // em/en dash
      .replace(/\u2018|\u2019|'|'/g, "")       // smart quotes single
      .replace(/\u201C|\u201D|"|"/g, "")       // smart quotes double
      .replace(/Ã¢â‚¬"/g, ", ")
      .replace(/Ã¢â‚¬Ëœ/g, "")
      .replace(/Ã¢â‚¬â„¢/g, "")
      .replace(/â€"/g, ", ")
      .replace(/â€™/g, "")
      .replace(/[^\x20-\x7E\u0900-\u097F\u0964\u0965\n.,!?;: [\]]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    if (scriptData.script)       scriptData.script       = cleanField(scriptData.script)
    if (scriptData.title)        scriptData.title        = cleanField(scriptData.title)
    if (scriptData.description)  scriptData.description  = cleanField(scriptData.description)
    if (scriptData.thumbnailText) scriptData.thumbnailText = scriptData.thumbnailText
      .replace(/[^A-Z0-9\s]/gi, "").toUpperCase().trim().split(/\s+/).slice(0, 4).join(" ")

    // Pexels clips
    let pexelsClips: any[] = []
    const pexelsKey = process.env.PEXELS_API_KEY
    if (pexelsKey) {
      try {
        const queries = config.pexelsQueries
        const q = encodeURIComponent(scriptData.pexelsQuery || queries[Math.floor(Math.random() * queries.length)])
        const pexRes = await fetch(
          `https://api.pexels.com/videos/search?query=${q}&per_page=8&orientation=${isShorts ? "portrait" : "landscape"}&size=medium`,
          { headers: { Authorization: pexelsKey } }
        )
        if (pexRes.ok) {
          const pexData = await pexRes.json()
          pexelsClips = (pexData.videos || []).slice(0, 5).map((v: any) => ({
            id: v.id,
            url: v.video_files?.find((f: any) => f.quality === "hd" && f.width <= 1280)?.link || v.video_files?.[0]?.link,
            duration: v.duration,
          }))
        }
      } catch(e) {}
    }

    return NextResponse.json({
      success: true,
      title: scriptData.title || topic,
      script: scriptData.script || "",
      description: scriptData.description || "",
      hook: scriptData.hook || randomHook,
      keyPoints: scriptData.keyPoints || [],
      callToAction: scriptData.callToAction || "",
      chapters: scriptData.chapters || [],
      pexelsQuery: scriptData.pexelsQuery || "",
      tags: scriptData.tags || [],
      voice: config.voice,
      voiceRate: config.voiceRate,
      voicePitch: config.voicePitch,
      videoMood: scriptData.videoMood || "energetic",
      category: catKey,
      isShorts,
      thumbnail: {
        boldText: scriptData.thumbnailText || (scriptData.title || "").replace(/[^A-Z0-9\s]/gi,"").toUpperCase().split(/\s+/).slice(0,4).join(" "),
        emoji: scriptData.thumbnailEmoji || "🔥",
      }
    })
  } catch (error: any) {
    console.error("Script gen error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}