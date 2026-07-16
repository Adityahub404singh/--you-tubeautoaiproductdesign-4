// app/api/videos/generate/route.ts - v8 PRO: Subcategories + Viral Hooks + SEO
import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

// ============================================================
// SUBCATEGORY SYSTEM — each category has 4-6 subcategories
// Each subcategory has: hooks[], titleFormula, thumbnailStyle, musicMood
// ============================================================
const SUBCATEGORIES: Record<string, any> = {
  psychology: {
    sub: ["dark_psychology", "body_language", "manipulation_tactics", "cognitive_bias", "attachment_theory", "subconscious_mind"],
    dark_psychology:    { hooks: ["Ye 3 tricks se log aapko control karte hain bina aapko pata chale,", "Dark psychology ka sabse khatarnak secret,", "Psychologist ne bataya ye sign mat ignore karna,"], title: "Dark Psychology: [TOPIC] Ka Khatarnak Sach", music: "dark ambient mysterious" },
    body_language:      { hooks: ["Ye body language sign dekha to samajh lo sach kya hai,", "Haath ki ye position batati hai sab kuch,", "Aankhein kabhi jhooth nahi bolti,"], title: "Body Language: [TOPIC] Se Pehchano Asli Iraada", music: "calm psychology" },
    manipulation_tactics:{ hooks: ["Ye 5 tarike se log aapko manipulate karte hain,", "Sales wale ye trick use karte hain aap par,", "Is word ka use mat karo kabhi,"], title: "[TOPIC]: Manipulation Tactics Jo Sabne Use Ki", music: "dark cinematic" },
    cognitive_bias:     { hooks: ["Aapka dimaag aapko roz bewakoof banata hai,", "Ye bias aapke har fesle mein hai,", "Scientists ne prove kiya ye galat sochte hain sab,"], title: "Cognitive Bias: [TOPIC] Se Aapka Dimaag Dhoka Khata Hai", music: "curious documentary" },
    attachment_theory:  { hooks: ["Aap kaisi relationship mein hain ye batata hai ek cheez,", "Bachpan ki ye cheez adult life barbaad karti hai,", "Ye attachment style aapki har relationship fail karti hai,"], title: "Attachment Theory: [TOPIC] Ka Asar Zindagi Par", music: "emotional piano" },
    subconscious_mind:  { hooks: ["Aapka subconscious aapko control kar raha hai,", "90% decisions subconscious leta hai,", "Neend mein ye hota hai aapke dimaag mein,"], title: "Subconscious Mind: [TOPIC] Ka Andar Ka Sach", music: "ambient mysterious" },
  },
  motivation: {
    sub: ["comeback_story", "discipline_habits", "morning_routine", "failure_lessons", "success_mindset", "productivity"],
    comeback_story:   { hooks: ["Ek banda tha jiske paas kuch nahi tha, aaj crore hai,", "Sabne haare ko dekha tha, par usne ek cheez nahi chodi,", "0 se 1 ka safar — real story,"], title: "Comeback Story: [TOPIC] Ne Kaise Badla Sab Kuch", music: "epic motivational" },
    discipline_habits:{ hooks: ["Ye ek habit crore log nahi kar sakte,", "Successful log subah uthke ye karte hain,", "66 din mein ye karo, zindagi badal jayegi,"], title: "Discipline: [TOPIC] Ki Habit Jo Sab Badal De", music: "powerful drive" },
    morning_routine:  { hooks: ["Subah ki pehli 1 ghante mein ye galti mat karna,", "Billionaires ki subah aisi hoti hai,", "Ye morning routine aapki productivity 10x karti hai,"], title: "Morning Routine: [TOPIC] Ka Secret Kamyabi Ka", music: "upbeat energetic" },
    failure_lessons:  { hooks: ["Ye failure successful logo ka pehla step tha,", "Haar ne aapko kuch diya jo jeet nahi de sakti,", "Elon Musk bhi 3 baar fail hua tha,"], title: "Failure Lessons: [TOPIC] Se Jo Sikhna Chahiye", music: "cinematic inspire" },
    success_mindset:  { hooks: ["90% log isi soch ki wajah se fail hote hain,", "Amir aur garib ki soch ka ek farq,", "Ye mindset shift aapki life 180 degree palat dega,"], title: "Success Mindset: [TOPIC] Se Badlo Soch", music: "epic orchestral" },
    productivity:     { hooks: ["Ye method se 8 ghante ka kaam 3 mein hota hai,", "Deep work ka matlab samjhe hain aap,", "Ye distraction aapki productivity 40% girata hai,"], title: "Productivity: [TOPIC] Karo 10x Zyada Kaam", music: "focus beats" },
  },
  businesslessons: {
    sub: ["startup_mistakes", "marketing_hacks", "negotiation", "leadership", "sales_psychology", "financial_freedom"],
    startup_mistakes: { hooks: ["99% startups isi ek galti se doobt hain,", "Founder ne pehle din ye bhool ki, sab kho diya,", "VC investor ne seedha poocha ye sawal,"], title: "Startup Mistakes: [TOPIC] Jo Founder Regret Karta Hai", music: "corporate urgent" },
    marketing_hacks:  { hooks: ["Ye marketing trick bina paisa ke viral karti hai,", "Coca-Cola ne ye trick use ki 100 saal se,", "Ye color change karne se sales 30% badi,"], title: "Marketing Hack: [TOPIC] Se Bina Budget Viral Bano", music: "upbeat corporate" },
    negotiation:      { hooks: ["Ye ek line salary double kar deti hai,", "FBI negotiator ka ye secret sab use karte hain,", "Kabhi bhi pehle price mat batao,"], title: "Negotiation: [TOPIC] Se Pao Jo Chahte Ho", music: "confident corporate" },
    leadership:       { hooks: ["Sab boss hote hain, leader koi koi hota hai,", "Ye ek quality sabse bade leaders mein common hai,", "Jeff Bezos ne ye ek rule banaya tha,"], title: "Leadership: [TOPIC] Ke Woh Guna Jo Logo Ko Inspire Kare", music: "inspiring corporate" },
    sales_psychology: { hooks: ["Customer ye nahi chahta jo aap bechte ho,", "Ye 3 words sales double kar dete hain,", "Sabse bada sales lie jo sab mante hain,"], title: "Sales Psychology: [TOPIC] Se Kuch Bhi Becho", music: "confident upbeat" },
    financial_freedom:{ hooks: ["25 saal mein financially free hone ka ek formula,", "Middle class ye galti karta hai puri zindagi,", "Ye asset aapko sote mein paise deta hai,"], title: "Financial Freedom: [TOPIC] Ka Raasta Aazadi Ka", music: "success ambient" },
  },
  storytelling: {
    sub: ["true_crime", "emotional_drama", "mystery_thriller", "real_life_hero", "betrayal_story", "redemption"],
    true_crime:       { hooks: ["Ye sach tha, par kisi ne believe nahi kiya,", "Police case band kar di, par sach alag tha,", "Us raat jo hua, court mein bhi bataya nahi gaya,"], title: "True Crime: [TOPIC] Ka Sach Jo Chhupaya Gaya", music: "dark suspense" },
    emotional_drama:  { hooks: ["Rona aayega, par ye sunna zaroori hai,", "Ek bete ne baap ke liye jo kiya woh,", "Hospital ki is kahani ne lakho logo ko rula diya,"], title: "Emotional Story: [TOPIC] — Dil Ko Chhoo Legi", music: "emotional strings" },
    mystery_thriller: { hooks: ["Koi nahi jaanta abhi bhi kya hua tha,", "Ye case aaj bhi unsolved hai,", "Raat ke 2 baje phone aaya, number unknown tha,"], title: "Mystery: [TOPIC] Ka Raaz Jo Abhi Nahi Khula", music: "thriller suspense" },
    real_life_hero:   { hooks: ["Ek aam aadmi ne woh kiya jo heroes karte hain,", "Kisi ne credit nahi liya, par duniya badal di,", "Ye banda sirf dil ki sunta hai,"], title: "Real Hero: [TOPIC] Ka Asli Hero Kaun Tha", music: "inspiring hero" },
    betrayal_story:   { hooks: ["Jis par sabse zyada trust kiya, usne hi toda,", "Partner, friend, family — ye betrayal sabse badi thi,", "Ye sacchi kahani aapko sochne par majboor karegi,"], title: "Betrayal: [TOPIC] Ne Jo Kiya Woh Maafinaar Nahi", music: "sad dramatic" },
    redemption:       { hooks: ["Sab haare maan chuke the, par usne nahi,", "Ek doosra mauka mila, aur sab badal gaya,", "Ye insaan jail se bahar aaya aur crore kamaya,"], title: "Redemption: [TOPIC] — Haar Ke Jeetne Walo Ki Kahani", music: "hopeful cinematic" },
  },
  history: {
    sub: ["india_untold", "mughal_secrets", "freedom_struggle", "ancient_civilizations", "world_wars", "forgotten_heroes"],
    india_untold:        { hooks: ["Ye history books mein kabhi nahi padhai gayi,", "India ki ye sacchai chhupai gayi thi,", "Ye khazana aaj bhi wahi hai,"], title: "India History: [TOPIC] Ka Chhupa Hua Sach", music: "epic orchestral" },
    mughal_secrets:      { hooks: ["Mughals ka ye secret history ne chhupa diya,", "Shahjahan ke baad jo hua, woh shocking hai,", "Ye Mughal darbar mein roz hota tha,"], title: "Mughal Secrets: [TOPIC] Ka Andar Ka Sach", music: "historical cinematic" },
    freedom_struggle:    { hooks: ["Azaadi ke liye ye kurbani di gayi, kisi ne nahi bataya,", "Is freedom fighter ka naam school mein nahi padha,", "August 1947 mein ye hua tha jo batate nahi,"], title: "Freedom: [TOPIC] Ki Larai Jo History Ne Bhulai", music: "patriotic orchestral" },
    ancient_civilizations:{ hooks: ["5000 saal purani civilization ka ye raaz,", "Ye technology 2000 saal pehle India mein thi,", "Harappa mein ye milna scientists ko shock kar gaya,"], title: "Ancient India: [TOPIC] Ka 5000 Saal Purana Raaz", music: "ancient mystery" },
    world_wars:          { hooks: ["World War 2 ka ye fact schools mein nahi padhate,", "Ek galat decision ne lakhon log maar diye,", "Hitler ke akhri din ka sach kya tha,"], title: "World War: [TOPIC] Ka Wo Sach Jo History Mein Nahi", music: "war documentary" },
    forgotten_heroes:    { hooks: ["Ye banda India ka sabse bada hero tha, koi nahi jaanta,", "Aurat ne kiya tha jo kisi mard nahi kar saka,", "Is naam ko bhula diya gaya, par kaam yaad hai,"], title: "Forgotten Hero: [TOPIC] — Jise India Bhool Gaya", music: "heroic strings" },
  },
  horror: {
    sub: ["haunted_places", "true_paranormal", "unexplained_events", "psychological_horror", "urban_legends", "cursed_objects"],
    haunted_places:     { hooks: ["Ye jagah India ki sabse darr wali jagah hai,", "Is building mein raat ko koi nahi rukta,", "Government ne is area ko seal kiya hua hai,"], title: "Haunted: [TOPIC] — Raat Ko Yahan Koi Nahi Jata", music: "horror ambient" },
    true_paranormal:    { hooks: ["Ye 100% sachi kahani hai, main swear karta hoon,", "Camera ne jo pakda, woh paranormal tha,", "Ye event scientific proof ke baad bhi unexplained hai,"], title: "Paranormal: [TOPIC] — Science Bhi Explain Nahi Kar Saka", music: "dark supernatural" },
    unexplained_events: { hooks: ["Ye event aaj bhi mystery hai duniya ke liye,", "Plane disappear ho gaya, 30 saal baad woh mila,", "Ye disappearance case aaj bhi open hai,"], title: "Mystery: [TOPIC] — Duniya Abhi Tak Samajh Nahi Pai", music: "thriller suspense" },
    psychological_horror:{ hooks: ["Ye cheez dimaag mein darr daalti hai bina baat ke,", "Sleep paralysis mein jo dikhta hai, woh kya hai,", "Ye disorder aapko khud se dara deta hai,"], title: "Psychological Horror: [TOPIC] Ka Dimaagi Darr", music: "psychological dark" },
    urban_legends:      { hooks: ["Ye kahani India ke har sheher mein hai,", "Nani dadi ki ye kahaaniyaan sach nikli,", "Kya sach mein aise hota hai midnight par,"], title: "Urban Legend: [TOPIC] — Sacchi Ya Jhooth?", music: "eerie ambient" },
    cursed_objects:      { hooks: ["Is cheez ko rakhne wala safe nahi hai,", "Museum ne is object ko seal kar rakha hai,", "Ye painting sirf bure logon ke saath hoti hai,"], title: "Cursed: [TOPIC] — Ye Object Kisi Ko Nahi Chuna Chahiye", music: "dark horror" },
  },
  ainews: {
    sub: ["ai_tools", "tech_giants", "future_jobs", "ai_india", "robotics", "digital_economy"],
    ai_tools:      { hooks: ["Ye AI tool launch hote hi viral ho gaya,", "ChatGPT ko ye tool peeche chhor gaya,", "Ye free tool aapka kaam 10x fast karta hai,"], title: "AI Tool Alert: [TOPIC] — Abhi Try Karo", music: "tech upbeat" },
    tech_giants:   { hooks: ["Google ne aaj jo announce kiya, sab hil gaye,", "Apple ka ye secret project finally bahar aaya,", "Microsoft ka ye move sab badal dega,"], title: "Tech News: [TOPIC] Ka Bada Elaan Aaj", music: "breaking news" },
    future_jobs:   { hooks: ["Ye 5 jobs AI 2 saal mein khatam kar dega,", "Ye skill seekh lo, AI replace nahi kar payega,", "2026 mein ye jobs demand mein hongi,"], title: "Future Jobs: [TOPIC] — AI Ke Baad Kya Bachega", music: "urgent documentary" },
    ai_india:      { hooks: ["India ka ye AI startup duniya mein chhaya,", "Government ne AI ke liye ye plan banaya,", "IIT se nikla ye AI tool viral ho gaya,"], title: "India AI: [TOPIC] — Desh Ka Tech Revolution", music: "patriotic upbeat" },
    robotics:      { hooks: ["Ye robot human jaisi baat karta hai,", "Factory mein robots ne workers replace kar diye,", "Ye humanoid robot 2025 mein aa raha hai,"], title: "Robots: [TOPIC] — Machines Ki Duniya Aa Gayi", music: "futuristic electronic" },
    digital_economy:{ hooks: ["Ye crypto 1000% return de raha hai,", "Digital rupee kya hoga India mein,", "NFT khatam hua ya abhi bhi chance hai,"], title: "Digital Economy: [TOPIC] — Paise Ka Future", music: "finance tech" },
  },
}

// Fill missing categories with general structure
const DEFAULT_SUB = {
  sub: ["general"],
  general: { hooks: ["Aaj kuch aisa bataunga jo aap sochte nahi,", "Ye baat aaj sabko jaanni chahiye,", "Ek simple cheez jo life badal deti hai,"], title: "[TOPIC] — Ye Jaanna Zaroori Tha", music: "cinematic emotional" }
}

const CATEGORY_CONFIG: Record<string, any> = {
  psychology:      { voice: "hi-IN-MadhurNeural", voiceRate: "+8%",  voicePitch: "-1Hz", pexels: ["brain neurons purple glow","therapy office calm","ocean waves night blue","city lights blur night","misty lake dawn"] },
  stoicism:        { voice: "hi-IN-MadhurNeural", voiceRate: "-5%",  voicePitch: "-3Hz", pexels: ["greek marble statue fog","foggy mountain solo","solitary silhouette","ancient ruins grayscale","calm lake mist"] },
  quotes:          { voice: "hi-IN-SwaraNeural",  voiceRate: "0%",   voicePitch: "0Hz",  pexels: ["warm sunset window","cozy coffee bokeh","golden hour bokeh","minimalist desk","golden nature calm"] },
  businesslessons: { voice: "hi-IN-MadhurNeural", voiceRate: "+10%", voicePitch: "+1Hz", pexels: ["office skyscraper glass","business handshake","stock chart green","city skyline bright","modern office clean"] },
  storytelling:    { voice: "hi-IN-SwaraNeural",  voiceRate: "-8%",  voicePitch: "-2Hz", pexels: ["dark forest cinematic","abandoned house mystery","rainy window noir","candle shadow room","old library dust"] },
  startupstories:  { voice: "hi-IN-MadhurNeural", voiceRate: "+10%", voicePitch: "+1Hz", pexels: ["startup office night","tech team coding","laptop screen glow","silicon valley modern","entrepreneur pitch"] },
  luxury:          { voice: "hi-IN-MadhurNeural", voiceRate: "+2%",  voicePitch: "0Hz",  pexels: ["luxury car night","gold watch shine","private jet interior","luxury yacht sunset","designer fashion"] },
  history:         { voice: "hi-IN-MadhurNeural", voiceRate: "-3%",  voicePitch: "-1Hz", pexels: ["ancient ruins fog","historical battlefield","old map parchment","ancient columns","vintage photograph"] },
  pov:             { voice: "hi-IN-SwaraNeural",  voiceRate: "+5%",  voicePitch: "+1Hz", pexels: ["cyberpunk city neon","immersive neon corridor","futuristic hallway glow","synthwave horizon","neon rain night"] },
  horror:          { voice: "hi-IN-SwaraNeural",  voiceRate: "-15%", voicePitch: "-5Hz", pexels: ["haunted house dark fog","horror corridor red","graveyard night mist","dark door shadow","scary forest fog"] },
  ainews:          { voice: "hi-IN-MadhurNeural", voiceRate: "+15%", voicePitch: "+2Hz", pexels: ["news studio broadcast","breaking news digital","world map digital","newsroom desk blue","digital ticker screen"] },
  motivation:      { voice: "hi-IN-MadhurNeural", voiceRate: "+8%",  voicePitch: "+0Hz", pexels: ["sunrise motivation epic","athlete training power","mountain peak victory","crowd cheering stadium","determination face"] },
  general:         { voice: "hi-IN-MadhurNeural", voiceRate: "+6%",  voicePitch: "0Hz",  pexels: ["cinematic aerial sunset","epic mountains golden","urban city timelapse","beautiful nature light","dramatic sky clouds"] },
}

const GROQ_MODELS = ["llama-3.3-70b-versatile", "meta-llama/llama-4-scout-17b-16e-instruct", "llama-3.1-8b-instant"]

async function groqWithFallback(groq: Groq, messages: any[], max_tokens: number, temperature: number): Promise<string> {
  for (const model of GROQ_MODELS) {
    try {
      const res = await groq.chat.completions.create({ model, messages, temperature, max_tokens })
      const content = res.choices[0].message.content || ""
      console.log(`✅ Groq model: ${model}`)
      return content
    } catch (e: any) {
      if (e?.status === 429) { console.log(`⚠️ Rate limit: ${model}`); continue }
      throw e
    }
  }
  throw new Error("All Groq models rate limited.")
}

function extractJSON(raw: string): any {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim()
  try { return JSON.parse(text) } catch {}
  const s = text.indexOf("{"), e = text.lastIndexOf("}")
  if (s !== -1 && e > s) {
    try { return JSON.parse(text.slice(s, e + 1)) } catch {}
    try { return JSON.parse(text.slice(s, e + 1).replace(/\r?\n/g, " ").replace(/\t/g, " ")) } catch {}
  }
  throw new Error("No valid JSON in response")
}

// Pick a random subcategory for variety
function getSubcategory(catKey: string): { subKey: string; subConfig: any } {
  const cat = SUBCATEGORIES[catKey] || DEFAULT_SUB
  const subs = cat.sub || ["general"]
  const subKey = subs[Math.floor(Math.random() * subs.length)]
  const subConfig = cat[subKey] || DEFAULT_SUB.general
  return { subKey, subConfig }
}

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { topic, language, channelName, category, mode, generate30Day } = await req.json()
    if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 })

    const catKey = (category || "general").toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
    const config = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.general
    const isShorts = mode === "shorts" || catKey === "shorts" || catKey === "horror"
    const lang = language || "Hindi"
    const channel = channelName || "My Channel"

    const { subKey, subConfig } = getSubcategory(catKey)
    const hooks = subConfig.hooks || ["Aaj kuch aisa bataunga jo aap sochte nahi,"]
    const randomHook = hooks[Math.floor(Math.random() * hooks.length)]
    const titleFormula = subConfig.title || "[TOPIC] — Jaanna Chahiye"
    const musicMood = subConfig.music || "cinematic ambient"

    console.log(`📂 Category: ${catKey} | Subcategory: ${subKey} | Music: ${musicMood}`)

    if (generate30Day) {
      const raw = await groqWithFallback(groq, [{
        role: "user",
        content: `Generate 30 unique YouTube Shorts video topics for "${topic}" in ${lang}.
Category: ${catKey} | Subcategories: ${(SUBCATEGORIES[catKey]?.sub || ["general"]).join(", ")}
Rules: Each topic different subcategory angle. Mix hooks — shocking, emotional, fact-based.
Return JSON array ONLY:
[{"day":1,"topic":"...","subcategory":"...","type":"facts|story|top10|motivation|psychology","hook":"opening line in Hindi","titleFormula":"title with topic filled in"}]`,
      }], 2500, 0.95)
      const schedule = extractJSON(raw)
      return NextResponse.json({ success: true, schedule30Day: Array.isArray(schedule) ? schedule : [] })
    }

    const seoTitle = titleFormula.replace("[TOPIC]", topic.slice(0, 30))

    const raw = await groqWithFallback(groq, [
      {
        role: "system",
        content: `You are India's #1 viral Hindi YouTube content creator. Category: ${catKey}. Subcategory: ${subKey}.
Music mood this video: ${musicMood}.
Channel: "${channel}" | Language: ${lang}

SCRIPT RULES:
- Start EXACTLY with this hook: "${randomHook}"
- Every sentence max 8 words
- Use [PAUSE] for 1-2 sec pauses for drama
- Pure Hindi/Hinglish spoken words only — NO markdown, NO bullets, NO symbols, NO dashes
- Duration: ${isShorts ? "30-45 seconds" : "4-6 minutes"}
- End with subscribe CTA

TITLE RULES:
- Use this formula: "${titleFormula.replace("[TOPIC]", topic)}"
- Max 60 chars, include numbers if possible

THUMBNAIL RULES:
- thumbnailText: exactly 2-4 ALL CAPS power words (no more)
- thumbnailEmoji: 1 emoji matching the emotion

DESCRIPTION RULES (YouTube SEO):
- First 2 lines are most important (shown in search)
- Include: what video is about, main keywords, channel name
- End with 5-7 relevant Hindi hashtags + 3 English hashtags

TAGS RULES:
- Mix Hindi + English tags
- Include: category keywords, trending Indian search terms, topic-specific

RESPOND ONLY WITH VALID JSON — no markdown, no explanation`,
      },
      {
        role: "user",
        content: `Create a complete ${isShorts ? "YouTube Shorts (30-45s)" : "YouTube video (4-6 min)"} for topic: "${topic}"

Return this EXACT JSON:
{
  "title": "${seoTitle}",
  "hook": "${randomHook}",
  "script": "Complete spoken script in ${lang}. Start with hook. Use [PAUSE]. Natural speech only. All one line.",
  "description": "SEO description: first line = main keyword + what video covers. Second line = subscribe hook. Then 150 words of context. End: #hindi #${catKey} #viral #india #shorts #trending #knowledge",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "callToAction": "Subscribe CTA in ${lang}",
  "pexelsQuery": "3-4 English words for stock footage matching ${catKey} ${subKey}",
  "thumbnailText": "2-4 WORDS ALL CAPS",
  "thumbnailEmoji": "1 emoji",
  "tags": ["${catKey}","${subKey}","hindi","india","viral","shorts","${topic.split(" ")[0].toLowerCase()}","trending","facts","knowledge","motivation","youtube"],
  "chapters": ["0:00 - Hook","0:15 - Main Point","0:40 - Conclusion"],
  "videoMood": "${musicMood}",
  "subcategory": "${subKey}"
}`,
      },
    ], 4000, 0.85)

    const scriptData = extractJSON(raw)

    const cleanField = (s: string) => (s || "")
      .replace(/\u2014|\u2013/g, ", ").replace(/\u2018|\u2019|\u201C|\u201D/g, "")
      .replace(/[^\x20-\x7E\u0900-\u097F\u0964\u0965\n.,!?;: [\]]/g, " ")
      .replace(/\s+/g, " ").trim()

    if (scriptData.script)       scriptData.script       = cleanField(scriptData.script)
    if (scriptData.title)        scriptData.title        = cleanField(scriptData.title) || seoTitle
    if (scriptData.description)  scriptData.description  = cleanField(scriptData.description)
    if (scriptData.thumbnailText) scriptData.thumbnailText = scriptData.thumbnailText
      .replace(/[^A-Z0-9\s]/gi, "").toUpperCase().trim().split(/\s+/).slice(0, 4).join(" ")

    const pexelsKey = process.env.PEXELS_API_KEY
    let pexelsClips: any[] = []
    if (pexelsKey) {
      try {
        const q = encodeURIComponent(scriptData.pexelsQuery || config.pexels[0])
        const pexRes = await fetch(`https://api.pexels.com/videos/search?query=${q}&per_page=8&orientation=${isShorts ? "portrait" : "landscape"}&size=medium`, { headers: { Authorization: pexelsKey } })
        if (pexRes.ok) {
          const pexData = await pexRes.json()
          pexelsClips = (pexData.videos || []).slice(0, 5).map((v: any) => ({
            id: v.id,
            url: v.video_files?.find((f: any) => f.quality === "hd" && f.width <= 1280)?.link || v.video_files?.[0]?.link,
            duration: v.duration,
          }))
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      title:         scriptData.title       || seoTitle,
      script:        scriptData.script      || "",
      description:   scriptData.description || "",
      hook:          scriptData.hook        || randomHook,
      keyPoints:     scriptData.keyPoints   || [],
      callToAction:  scriptData.callToAction || "",
      chapters:      scriptData.chapters    || [],
      pexelsQuery:   scriptData.pexelsQuery  || "",
      tags:          scriptData.tags         || [],
      voice:         config.voice,
      voiceRate:     config.voiceRate,
      voicePitch:    config.voicePitch,
      videoMood:     scriptData.videoMood   || musicMood,
      category:      catKey,
      subcategory:   scriptData.subcategory || subKey,
      pexelsClips,
      thumbnail: {
        boldText: scriptData.thumbnailText || seoTitle.toUpperCase().split(/\s+/).slice(0, 3).join(" "),
        emoji:    scriptData.thumbnailEmoji || "🔥",
      },
    })
  } catch (error: any) {
    console.error("Script gen error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
