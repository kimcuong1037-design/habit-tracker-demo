import { api } from "./client.js";

// TODO: 使用 shared 包中的 TodayResponse 类型（需要根据实际 API 响应调整）
export interface TodayData {
  progress: { total: number; completed: number; allDone: boolean };
  habits: Array<Record<string, unknown>>;
  retroactiveQuota: { month: string; used: number; limit: number; remaining: number };
  pendingStreakBreaks: Array<Record<string, unknown>>;
  pendingMilestones: Array<Record<string, unknown>>;
}

/** 获取今日综合视图 */
export function getToday(date?: string) {
  const qs = date ? `?date=${date}` : "";
  return api.get<{ data: TodayData }>(`/api/today${qs}`);
}

/** 关闭里程碑回顾 */
export function dismissMilestone(id: string) {
  return api.post<{ data: { id: string; dismissed: boolean } }>(
    `/api/milestones/${id}/dismiss`,
  );
}

/** 关闭断裂安慰消息 */
export function dismissStreakBreak(id: string) {
  return api.post<{ data: { id: string; comfortShown: boolean } }>(
    `/api/streak-breaks/${id}/dismiss`,
  );
}
