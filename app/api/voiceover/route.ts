import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { text, title } = await req.json()
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 })

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 })

    const voiceId = "21m00Tcm4TlvDq8ikWAM"

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.slice(0, 800),
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true
        }
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("ElevenLabs error:", errText)
      return NextResponse.json({ error: "Voice generation failed" }, { status: 500 })
    }

    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    return NextResponse.json({ success: true, audioUrl: `data:audio/mpeg;base64,${base64}`, title: title || "voiceover" })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 })
  }
}
