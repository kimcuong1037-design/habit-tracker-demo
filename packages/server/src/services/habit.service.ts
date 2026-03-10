import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import { MAX_ACTIVE_HABITS } from "@habit-tracker/shared";
import type { CreateHabitRequest, UpdateHabitRequest } from "@habit-tracker/shared";
// import { calculateStreak } from "./streak.service.js"; // TODO: Phase 2 启用

/** 创建习惯 */
export async function createHabit(userId: string, data: CreateHabitRequest) {
  // 检查活跃习惯数量上限
  const activeCount = await prisma.habit.count({
    where: { userId, isActive: true },
  });
  if (activeCount >= MAX_ACTIVE_HABITS) {
    throw new AppError(409, "HABIT_LIMIT_REACHED", `活跃习惯已达 ${MAX_ACTIVE_HABITS} 个上限`);
  }

  // stacking 模式下验证关联习惯存在
  if (data.stackedHabitId) {
    const stacked = await prisma.habit.findFirst({
      where: { id: data.stackedHabitId, userId },
    });
    if (!stacked) {
      throw new AppError(404, "NOT_FOUND", "叠加习惯不存在");
    }
  }

  const nextOrder = await prisma.habit.count({ where: { userId } });

  const habit = await prisma.habit.create({
    data: {
      userId,
      name: data.name,
      description: data.description ?? null,
      startDate: data.startDate,
      cueType: data.cueType,
      cueValue: data.cueValue,
      stackedHabitId: data.stackedHabitId ?? null,
      sortOrder: nextOrder,
    },
  });

  return habit;
}

/** 获取习惯列表（含计算字段） */
export async function listHabits(
  userId: string,
  options: { date?: string; active?: boolean },
) {
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      ...(options.active !== false ? { isActive: true } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  // TODO Phase 2: 为每个习惯计算 checkedInToday, currentStreak, canRetroactive, totalCheckIns
  return habits;
}

/** 获取单个习惯详情 */
export async function getHabit(userId: string, habitId: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });
  if (!habit) {
    throw new AppError(404, "NOT_FOUND", "习惯不存在");
  }

  // TODO Phase 2: 附加 currentStreak, longestStreak, totalCheckIns, completionRate, checkedInToday, canRetroactive
  return habit;
}

/** 更新习惯 */
export async function updateHabit(userId: string, habitId: string, data: UpdateHabitRequest) {
  const existing = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "习惯不存在");
  }

  if (data.stackedHabitId) {
    const stacked = await prisma.habit.findFirst({
      where: { id: data.stackedHabitId, userId },
    });
    if (!stacked) {
      throw new AppError(404, "NOT_FOUND", "叠加习惯不存在");
    }
  }

  const habit = await prisma.habit.update({
    where: { id: habitId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.cueType !== undefined && { cueType: data.cueType }),
      ...(data.cueValue !== undefined && { cueValue: data.cueValue }),
      ...(data.stackedHabitId !== undefined && { stackedHabitId: data.stackedHabitId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });

  return habit;
}

/** 删除习惯（级联删除关联数据） */
export async function deleteHabit(userId: string, habitId: string) {
  const existing = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "习惯不存在");
  }

  // Prisma schema 中应配置 onDelete: Cascade，这里直接删除即可
  await prisma.habit.delete({ where: { id: habitId } });
}
