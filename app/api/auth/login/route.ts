import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createClient } from "@libsql/client"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    const db = createClient({
      url: process.env.DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })

    const result = await db.execute({
      sql: "SELECT * FROM User WHERE email=?",
      args: [email.toLowerCase().trim()]
    })

    if (result.rows.length === 0) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })

    const u = result.rows[0] as any
    if (u.password) {
      const valid = await bcrypt.compare(password, u.password)
      if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    return NextResponse.json({ success: true, user: { id: u.id, email: u.email, name: u.name, phone: u.phone||"", role: u.role, plan: u.plan, hasCompletedSetup: !!u.hasCompletedSetup, freeVideosUsed: u.freeVideosUsed||0, paidVideoCredits: u.paidVideoCredits||0 } })
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
