const fs = require('fs');

fs.mkdirSync('app/api/db/users', {recursive:true});
fs.mkdirSync('app/api/db/videos', {recursive:true});
fs.mkdirSync('app/api/db/channels', {recursive:true});

fs.writeFileSync('lib/db.ts', 
import { PrismaClient } from "@prisma/client"
import { PrismaLibSQL } from "@prisma/adapter-libsql"
import { createClient } from "@libsql/client"
import path from "path"
const dbPath = "file:" + path.join(process.cwd(), "prisma", "dev.db").replace(/\\\\/g, "/")
const g = globalThis as any
export const prisma = g.prisma || new PrismaClient({ adapter: new PrismaLibSQL(createClient({ url: dbPath })) })
if (process.env.NODE_ENV !== "production") g.prisma = prisma
export default prisma
);

fs.writeFileSync('app/api/db/users/route.ts', 
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const id = searchParams.get("id")
  try {
    if (email) return NextResponse.json(await prisma.user.findUnique({ where: { email } }))
    if (id) return NextResponse.json(await prisma.user.findUnique({ where: { id } }))
    return NextResponse.json(await prisma.user.findMany())
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const user = await prisma.user.upsert({ where: { email: data.email }, update: data, create: data })
    return NextResponse.json(user)
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    return NextResponse.json(await prisma.user.update({ where: { id }, data: updates }))
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
);

fs.writeFileSync('app/api/db/videos/route.ts', 
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const where: any = {}
  const channelId = searchParams.get("channelId")
  const userId = searchParams.get("userId")
  const status = searchParams.get("status")
  if (channelId) where.channelId = channelId
  if (userId) where.userId = userId
  if (status) where.status = status
  try {
    return NextResponse.json(await prisma.video.findMany({ where, orderBy: { createdAt: "desc" } }))
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags)
    return NextResponse.json(await prisma.video.create({ data }))
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    if (Array.isArray(updates.tags)) updates.tags = JSON.stringify(updates.tags)
    return NextResponse.json(await prisma.video.update({ where: { id }, data: updates }))
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
);

fs.writeFileSync('app/api/db/channels/route.ts', 
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId")
  try {
    return NextResponse.json(await prisma.channel.findMany({ where: userId ? { userId } : {} }))
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try {
    return NextResponse.json(await prisma.channel.create({ data: await req.json() }))
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    return NextResponse.json(await prisma.channel.update({ where: { id }, data: updates }))
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    await prisma.channel.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch(e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
);

console.log('All DB files created!');
