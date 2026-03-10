import { api } from "./client.js";
import type {
  Habit,
  CreateHabitRequest,
  UpdateHabitRequest,
  CreateCheckInRequest,
  CheckIn,
} from "@habit-tracker/shared";

/** 创建习惯 */
export function createHabit(data: CreateHabitRequest) {
  return api.post<{ data: Habit }>("/api/habits", data);
}

/** 获取习惯列表 */
export function listHabits(options?: { date?: string; active?: boolean }) {
  const params = new URLSearchParams();
  if (options?.date) params.set("date", options.date);
  if (options?.active !== undefined) params.set("active", String(options.active));
  const qs = params.toString();
  return api.get<{ data: Habit[] }>(`/api/habits${qs ? `?${qs}` : ""}`);
}

/** 获取单个习惯详情 */
export function getHabit(id: string) {
  return api.get<{ data: Habit }>(`/api/habits/${id}`);
}

/** 更新习惯 */
export function updateHabit(id: string, data: UpdateHabitRequest) {
  return api.put<{ data: Habit }>(`/api/habits/${id}`, data);
}

/** 删除习惯 */
export function deleteHabit(id: string) {
  return api.delete<{ message: string }>(`/api/habits/${id}`);
}

/** 打卡 */
export function createCheckIn(habitId: string, data: CreateCheckInRequest) {
  return api.post<{ data: { checkIn: CheckIn; updatedStreak: number; milestone: unknown } }>(
    `/api/habits/${habitId}/check-ins`,
    data,
  );
}

/** 获取打卡历史 */
export function listCheckIns(habitId: string, options?: { from?: string; to?: string }) {
  const params = new URLSearchParams();
  if (options?.from) params.set("from", options.from);
  if (options?.to) params.set("to", options.to);
  const qs = params.toString();
  return api.get<{ data: CheckIn[] }>(`/api/habits/${habitId}/check-ins${qs ? `?${qs}` : ""}`);
}
