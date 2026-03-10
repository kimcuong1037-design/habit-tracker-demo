import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 创建默认用户（v1 单用户模式）
  await prisma.user.upsert({
    where: { id: "default-user" },
    update: {},
    create: {
      id: "default-user",
      email: null,
    },
  });

  console.log("Seed completed: default user created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
