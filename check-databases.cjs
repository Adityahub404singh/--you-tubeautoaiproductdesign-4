const { PrismaClient } = require("@prisma/client");

async function check(url, label) {
  const db = new PrismaClient({
    datasources: { db: { url } }
  });

  try {
    const users = await db.user.findMany({
      select: { email: true, role: true }
    });
    console.log("\nDATABASE:", label);
    console.log(users);
  } catch (e) {
    console.log("\nDATABASE ERROR:", label, e.message);
  } finally {
    await db.$disconnect();
  }
}

async function main() {
  await check("file:./prisma/dev.db", "prisma/dev.db");
  await check("file:./dev.db", "root dev.db");
}

main().catch(console.error);
