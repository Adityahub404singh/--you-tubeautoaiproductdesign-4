import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { script } = await req.json()
    if (!script) return NextResponse.json({ error: "Script required" }, { status: 400 })

    const shortScript = script.slice(0, 2000)

    // Google Text-to-Speech API (free)
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text: shortScript },
        voice: { languageCode: "hi-IN", name: "hi-IN-Wavenet-B", ssmlGender: "MALE" },
        audioConfig: { audioEncoding: "MP3", speakingRate: 1.0, pitch: 0 }
      })
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Google TTS: ${err}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      audio: data.audioContent,
      format: "mp3",
    })
  } catch (error: any) {
    console.error("Voice error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
