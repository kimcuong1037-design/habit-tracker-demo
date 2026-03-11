import type { TodayResponse } from "@habit-tracker/shared";
import { api } from "./client.js";

export type TodayData = TodayResponse["data"];

/** 获取今日综合视图 */
export function getToday(date?: string) {
  const qs = date ? `?date=${date}` : "";
  return api.get<TodayResponse>(`/api/today${qs}`);
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
