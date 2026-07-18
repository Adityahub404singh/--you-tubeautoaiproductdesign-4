import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// ⚠️ JUGAAD: Agar Vercel Env dhokha de, toh code yahan se seedha utha lega!
// Yahan apne asli URL aur Token quotes ke andar daal de
const FALLBACK_URL = "libsql://TERA_DATABASE_URL.turso.io"; 
const FALLBACK_TOKEN = "eyJhbGciOiJFZERTQSIsI..._TERA_POORA_TOKEN_YAHAN_PASTE_KAR_DE";

const dbUrl = process.env.DATABASE_URL || FALLBACK_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN || FALLBACK_TOKEN;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const libsql = createClient({
  url: dbUrl,
  authToken: dbToken,
});

// "as any" zaroori hai adapter mismatch hatane ke liye
const adapter = new PrismaLibSql(libsql as any);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}