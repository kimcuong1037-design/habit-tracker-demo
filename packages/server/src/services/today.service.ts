import dayjs from "dayjs";
import { prisma } from "../utils/prisma.js";
import { calculateStreak, calculateLongestStreak } from "./streak.service.js";
import { getRetroactiveQuota } from "./checkin.service.js";
import { getOrGenerateEncouragement } from "./encouragement.service.js";

/** 获取今日综合视图（DD-011） */
export async function getTodayView(userId: string, date?: string) {
  const baseDate = date || dayjs().format("YYYY-MM-DD");

  // 查询所有活跃习惯
  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const yesterday = dayjs(baseDate).subtract(1, "day").format("YYYY-MM-DD");
  const dayBeforeYesterday = dayjs(baseDate).subtract(2, "day").format("YYYY-MM-DD");

  // StreakBreak 自动检测（DD-004）
  // 如果前天有打卡但昨天没有，说明昨天断了连续打卡
  await Promise.all(
    habits.map(async (habit) => {
      // 习惯必须在昨天之前就已开始
      if (habit.startDate > dayBeforeYesterday) return;

      const yesterdayCheckIn = await prisma.checkIn.findUnique({
        where: { habitId_date: { habitId: habit.id, date: yesterday } },
      });
      if (yesterdayCheckIn) return; // 昨天有打卡，没断

      const dayBeforeCheckIn = await prisma.checkIn.findUnique({
        where: { habitId_date: { habitId: habit.id, date: dayBeforeYesterday } },
      });
      if (!dayBeforeCheckIn) return; // 前天也没打卡，不是刚断的

      // 检查是否已记录过这次断裂（@@unique([habitId, breakDate])）
      const existing = await prisma.streakBreakEvent.findUnique({
        where: { habitId_breakDate: { habitId: habit.id, breakDate: yesterday } },
      });
      if (existing) return;

      await prisma.streakBreakEvent.create({
        data: { habitId: habit.id, breakDate: yesterday },
      });
    }),
  );

  const habitItems = await Promise.all(
    habits.map(async (habit) => {
      const checkedInToday = !!(await prisma.checkIn.findUnique({
        where: { habitId_date: { habitId: habit.id, date: baseDate } },
      }));
      const currentStreak = await calculateStreak(habit.id, baseDate);
      const longestStreak = await calculateLongestStreak(habit.id);
      const totalCheckIns = await prisma.checkIn.count({ where: { habitId: habit.id } });

      const yesterdayCheckIn = await prisma.checkIn.findUnique({
        where: { habitId_date: { habitId: habit.id, date: yesterday } },
      });
      const canRetroactive = !yesterdayCheckIn && habit.startDate <= yesterday;

      return {
        ...habit,
        checkedInToday,
        currentStreak,
        longestStreak,
        totalCheckIns,
        canRetroactive,
      };
    }),
  );

  const completedCount = habitItems.filter((h) => h.checkedInToday).length;

  // 补卡配额
  const retroactiveQuota = await getRetroactiveQuota(userId, baseDate);

  // 待展示的断裂安慰
  const pendingStreakBreaks = await prisma.streakBreakEvent.findMany({
    where: {
      habit: { userId },
      comfortShown: false,
    },
    include: { habit: { select: { name: true } } },
  });

  // 待展示的里程碑
  const pendingMilestones = await prisma.milestoneEvent.findMany({
    where: {
      habit: { userId },
      dismissed: false,
    },
    include: { habit: { select: { name: true } } },
  });

  // AI 每日鼓励（DD-013）
  const progress = {
    total: habits.length,
    completed: completedCount,
    allDone: completedCount === habits.length && habits.length > 0,
  };

  const encouragement = habits.length > 0
    ? await getOrGenerateEncouragement({
        date: baseDate,
        habits: habitItems.map((h) => ({
          name: h.name,
          currentStreak: h.currentStreak,
          checkedInToday: h.checkedInToday,
          totalCheckIns: h.totalCheckIns,
        })),
        progress,
        hasStreakBreaks: pendingStreakBreaks.length > 0,
      })
    : null;

  return {
    progress,
    habits: habitItems,
    encouragement,
    retroactiveQuota,
    pendingStreakBreaks: pendingStreakBreaks.map((sb) => ({
      id: sb.id,
      habitId: sb.habitId,
      habitName: sb.habit.name,
      breakDate: sb.breakDate,
    })),
    pendingMilestones: pendingMilestones.map((m) => ({
      id: m.id,
      habitId: m.habitId,
      habitName: m.habit.name,
      type: m.type,
      totalDays: m.totalDays,
      completionRate: m.completionRate,
      longestStreak: m.longestStreak,
    })),
  };
}
