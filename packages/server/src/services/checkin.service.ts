import dayjs from "dayjs";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import { MAX_RETROACTIVE_PER_MONTH } from "@habit-tracker/shared";
import type { CreateCheckInRequest } from "@habit-tracker/shared";
import { calculateStreak } from "./streak.service.js";

/** 打卡 */
export async function createCheckIn(userId: string, habitId: string, data: CreateCheckInRequest) {
  // 验证习惯存在且属于该用户
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });
  if (!habit) {
    throw new AppError(404, "NOT_FOUND", "习惯不存在");
  }

  const today = dayjs().format("YYYY-MM-DD");
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
  const isRetroactive = data.date === yesterday;

  // 仅允许今天或昨天
  if (data.date !== today && data.date !== yesterday) {
    throw new AppError(400, "VALIDATION_ERROR", "只能为今天或昨天打卡");
  }

  // 检查重复打卡
  const existing = await prisma.checkIn.findUnique({
    where: { habitId_date: { habitId, date: data.date } },
  });
  if (existing) {
    throw new AppError(409, "ALREADY_CHECKED_IN", "该日期已打过卡");
  }

  // 补卡配额检查
  if (isRetroactive) {
    const monthStart = dayjs().startOf("month").format("YYYY-MM-DD");
    const monthEnd = dayjs().endOf("month").format("YYYY-MM-DD");
    const retroCount = await prisma.checkIn.count({
      where: {
        habit: { userId },
        isRetroactive: true,
        date: { gte: monthStart, lte: monthEnd },
      },
    });
    if (retroCount >= MAX_RETROACTIVE_PER_MONTH) {
      throw new AppError(409, "RETROACTIVE_QUOTA_EXCEEDED", "本月补卡配额已用完");
    }
  }

  // 创建打卡记录
  const checkIn = await prisma.checkIn.create({
    data: {
      habitId,
      date: data.date,
      isRetroactive,
    },
  });

  // 计算新 streak
  const currentStreak = await calculateStreak(habitId, data.date);
  // TODO Phase 2: 检查里程碑触发
  const milestone = null; // placeholder

  return { checkIn, updatedStreak: currentStreak, milestone };
}

/** 获取打卡历史 */
export async function listCheckIns(
  userId: string,
  habitId: string,
  options: { from?: string; to?: string },
) {
  // 验证习惯属于该用户
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });
  if (!habit) {
    throw new AppError(404, "NOT_FOUND", "习惯不存在");
  }

  const checkIns = await prisma.checkIn.findMany({
    where: {
      habitId,
      ...(options.from || options.to
        ? {
            date: {
              ...(options.from ? { gte: options.from } : {}),
              ...(options.to ? { lte: options.to } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
  });

  return checkIns;
}

/** 查询本月补卡配额 */
export async function getRetroactiveQuota(userId: string, date?: string) {
  const baseDate = date ? dayjs(date) : dayjs();
  const month = baseDate.format("YYYY-MM");
  const monthStart = baseDate.startOf("month").format("YYYY-MM-DD");
  const monthEnd = baseDate.endOf("month").format("YYYY-MM-DD");

  const used = await prisma.checkIn.count({
    where: {
      habit: { userId },
      isRetroactive: true,
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  return {
    month,
    used,
    limit: MAX_RETROACTIVE_PER_MONTH,
    remaining: Math.max(0, MAX_RETROACTIVE_PER_MONTH - used),
  };
}
