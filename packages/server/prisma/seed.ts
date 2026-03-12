import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 创建预置 demo 账号（see DD-015）
  const passwordHash = await bcrypt.hash("demo1234", 10);
  await prisma.user.upsert({
    where: { username: "demo" },
    update: {},
    create: {
      id: "demo-user-id",
      username: "demo",
      passwordHash,
    },
  });

  console.log("Seed completed: demo user created (demo / demo1234).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
