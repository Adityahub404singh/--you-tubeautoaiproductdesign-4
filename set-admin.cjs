const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = "singhaditya4560@gmail.com";

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true }
  });

  if (!user) throw new Error("Account not found.");

  console.log("Account found:", user);

  const updated = await prisma.user.update({
    where: { email },
    data: { role: "admin" },
    select: { id: true, email: true, role: true }
  });

  console.log("Updated account:", updated);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
