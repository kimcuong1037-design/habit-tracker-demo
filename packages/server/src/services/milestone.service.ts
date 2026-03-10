import { prisma } from "../utils/prisma.js";
import { AppError } from "../middleware/error-handler.js";

/** 关闭里程碑回顾 */
export async function dismissMilestone(userId: string, milestoneId: string) {
  const milestone = await prisma.milestoneEvent.findFirst({
    where: { id: milestoneId, habit: { userId } },
  });
  if (!milestone) {
    throw new AppError(404, "NOT_FOUND", "里程碑不存在");
  }

  const updated = await prisma.milestoneEvent.update({
    where: { id: milestoneId },
    data: { dismissed: true },
  });

  return { id: updated.id, dismissed: updated.dismissed };
}
