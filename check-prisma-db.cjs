const path = require("path");
const { PrismaClient } = require("@prisma/client");

const dbPath = path.resolve("prisma/dev.db");
const url = "file:" + dbPath.replace(/\\/g, "/");

console.log("Checking database:", url);

const prisma = new PrismaClient({
  datasources: { db: { url } }
});

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true }
  });
  console.log(users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
