import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { prisma } from "../utils/prisma.js";
import { CueType } from "@habit-tracker/shared";

const JWT_SECRET = process.env.JWT_SECRET || "habit-tracker-dev-secret";

/** 创建测试用户并返回 user + JWT token */
export async function createTestUser(
  overrides?: Partial<{ username: string; password: string }>,
) {
  const username = overrides?.username ?? `test_${randomUUID().slice(0, 8)}`;
  const password = overrides?.password ?? "test123456";
  const passwordHash = await bcrypt.hash(password, 4); // 低 rounds 加速测试
  const user = await prisma.user.create({ data: { username, passwordHash } });
  const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, {
    expiresIn: "1h",
  });
  return { user, token, password };
}

/** 创建测试习惯 */
export async function createTestHabit(
  userId: string,
  overrides?: Partial<{
    name: string;
    startDate: string;
    cueType: string;
    cueValue: string;
    isActive: boolean;
  }>,
) {
  return prisma.habit.create({
    data: {
      userId,
      name: overrides?.name ?? "测试习惯",
      startDate: overrides?.startDate ?? "2026-01-01",
      cueType: overrides?.cueType ?? CueType.TRIGGER,
      cueValue: overrides?.cueValue ?? "起床后",
      isActive: overrides?.isActive ?? true,
      sortOrder: 0,
    },
  });
}

/** 创建测试打卡记录 */
export async function createTestCheckIn(
  habitId: string,
  date: string,
  isRetroactive = false,
) {
  return prisma.checkIn.create({
    data: { habitId, date, isRetroactive },
  });
}
