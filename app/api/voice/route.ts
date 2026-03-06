import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { script, voice_id } = await req.json()
    if (!script) return NextResponse.json({ error: "Script required" }, { status: 400 })

    // Script ko 500 chars tak limit karo (ElevenLabs free limit)
    const shortScript = script.slice(0, 500)

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id || "pNInz6obpgDQGcFmaJgB"}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: shortScript,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`ElevenLabs error: ${err}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString("base64")

    return NextResponse.json({
      success: true,
      audio: base64Audio,
      format: "mp3",
      duration_estimate: Math.ceil(shortScript.length / 15),
    })
  } catch (error: any) {
    console.error("Voice generation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
