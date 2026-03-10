import dayjs from "dayjs";
import { prisma } from "../utils/prisma.js";

/**
 * 计算当前连续打卡天数（DD-003: 实时计算，不存储）
 * 从 baseDate 向前连续检查每一天是否有打卡记录
 */
export async function calculateStreak(habitId: string, baseDate?: string): Promise<number> {
  const checkIns = await prisma.checkIn.findMany({
    where: { habitId },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (checkIns.length === 0) return 0;

  const dates = new Set(checkIns.map((c) => c.date));
  let current = dayjs(baseDate);
  let streak = 0;

  // 如果今天还没打卡，从昨天开始算
  if (!dates.has(current.format("YYYY-MM-DD"))) {
    current = current.subtract(1, "day");
  }

  while (dates.has(current.format("YYYY-MM-DD"))) {
    streak++;
    current = current.subtract(1, "day");
  }

  return streak;
}

/** 计算最长连续打卡天数 */
export async function calculateLongestStreak(habitId: string): Promise<number> {
  const checkIns = await prisma.checkIn.findMany({
    where: { habitId },
    orderBy: { date: "asc" },
    select: { date: true },
  });

  if (checkIns.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < checkIns.length; i++) {
    const prev = dayjs(checkIns[i - 1].date);
    const curr = dayjs(checkIns[i].date);
    if (curr.diff(prev, "day") === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}
