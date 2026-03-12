import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { beforeEach, afterAll } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 使用独立的测试数据库
const TEST_DB_PATH = path.resolve(__dirname, "../../prisma/test.db");
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

// 在所有测试前推送 schema 到测试数据库
execSync("npx prisma db push --skip-generate --accept-data-loss", {
  cwd: path.resolve(__dirname, "../.."),
  env: { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` },
  stdio: "ignore",
});

// 延迟导入 prisma（确保 DATABASE_URL 已设置）
const { prisma } = await import("../utils/prisma.js");

// 每个测试前清空数据
beforeEach(async () => {
  await prisma.dailyEncouragement.deleteMany();
  await prisma.streakBreakEvent.deleteMany();
  await prisma.milestoneEvent.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.user.deleteMany();
});

// 全部测试结束后断开连接并删除测试数据库
afterAll(async () => {
  await prisma.$disconnect();
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = TEST_DB_PATH + suffix;
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});
