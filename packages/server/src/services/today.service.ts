import dayjs from "dayjs";
import { prisma } from "../utils/prisma.js";
import { calculateStreak, calculateLongestStreak } from "./streak.service.js";
import { getRetroactiveQuota } from "./checkin.service.js";

/** 获取今日综合视图（DD-011） */
export async function getTodayView(userId: string, date?: string) {
  const baseDate = date || dayjs().format("YYYY-MM-DD");

  // 查询所有活跃习惯
  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const yesterday = dayjs(baseDate).subtract(1, "day").format("YYYY-MM-DD");

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

  return {
    progress: {
      total: habits.length,
      completed: completedCount,
      allDone: completedCount === habits.length && habits.length > 0,
    },
    habits: habitItems,
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
