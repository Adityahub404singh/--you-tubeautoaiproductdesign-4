import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("libsql")) {
    const { PrismaLibSQL } = require("@prisma/adapter-libsql")
    const { createClient } = require("@libsql/client")
    const libsql = createClient({
      url: process.env.DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter })
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma || createPrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
