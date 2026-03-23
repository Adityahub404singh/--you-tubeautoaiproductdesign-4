import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import path from "path"

const dbUrl = "file:" + path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/")
const adapter = new PrismaLibSql({ url: dbUrl })
const g = globalThis as any

export const prisma: PrismaClient = g.prisma || new PrismaClient({ adapter } as any)
if (process.env.NODE_ENV !== "production") g.prisma = prisma
export default prisma