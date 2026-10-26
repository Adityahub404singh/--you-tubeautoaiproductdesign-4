
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const dbPath = path
    .join(process.cwd(), "prisma", "dev.db")
    .replace(/\\/g, "/");

  const adapter = new PrismaLibSQL({
    url: `file:${dbPath}`,
  });

  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
