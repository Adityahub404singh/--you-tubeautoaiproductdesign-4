import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createClient } from "@libsql/client"

function cuid() { return "u_" + Date.now() + Math.random().toString(36).slice(2,8) }

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json()
    if (!name || !email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    const db = createClient({
      url: process.env.DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })

    const existing = await db.execute({ sql: "SELECT id FROM User WHERE email=?", args: [email.toLowerCase().trim()] })
    if (existing.rows.length > 0) return NextResponse.json({ error: "Email already exists" }, { status: 409 })

    const hash = await bcrypt.hash(password, 10)
    const id = cuid()
    try { await db.execute("ALTER TABLE User ADD COLUMN password TEXT") } catch {}

    await db.execute({
      sql: "INSERT INTO User (id, email, name, phone, role, plan, hasCompletedSetup, password) VALUES (?,?,?,?,?,?,?,?)",
      args: [id, email.toLowerCase().trim(), name, phone||"", "user", "free", 0, hash]
    })

    return NextResponse.json({ success: true, user: { id, email, name, phone: phone||"", role: "user", plan: "free", hasCompletedSetup: false, freeVideosUsed: 0, paidVideoCredits: 0 } })
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
