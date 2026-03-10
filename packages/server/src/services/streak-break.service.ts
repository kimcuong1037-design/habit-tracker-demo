import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/error-handler.js";

/** 关闭断裂安慰消息 */
export async function dismissStreakBreak(userId: string, streakBreakId: string) {
  const event = await prisma.streakBreakEvent.findFirst({
    where: { id: streakBreakId, habit: { userId } },
  });
  if (!event) {
    throw new AppError(404, "NOT_FOUND", "断裂安慰记录不存在");
  }

  const updated = await prisma.streakBreakEvent.update({
    where: { id: streakBreakId },
    data: { comfortShown: true },
  });

  return { id: updated.id, comfortShown: updated.comfortShown };
}
