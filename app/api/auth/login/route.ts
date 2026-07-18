import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@libsql/client"
import { createHash } from "crypto"

const db = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    const hash = createHash("sha256").update(password).digest("hex")
    const result = await db.execute({
      sql: "SELECT * FROM User WHERE email=? AND (password=? OR password IS NULL)",
      args: [email, hash]
    })

    if (result.rows.length === 0) {
      // Try without password check (for admin users created manually)
      const r2 = await db.execute({ sql: "SELECT * FROM User WHERE email=?", args: [email] })
      if (r2.rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 401 })
      const u = r2.rows[0] as any
      return NextResponse.json({ success: true, user: { id: u.id, email: u.email, name: u.name, phone: u.phone||"", role: u.role, plan: u.plan, hasCompletedSetup: !!u.hasCompletedSetup, freeVideosUsed: u.freeVideosUsed||0, paidVideoCredits: u.paidVideoCredits||0 } })
    }

    const u = result.rows[0] as any
    return NextResponse.json({ success: true, user: { id: u.id, email: u.email, name: u.name, phone: u.phone||"", role: u.role, plan: u.plan, hasCompletedSetup: !!u.hasCompletedSetup, freeVideosUsed: u.freeVideosUsed||0, paidVideoCredits: u.paidVideoCredits||0 } })
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
