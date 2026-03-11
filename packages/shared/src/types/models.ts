import type { CueType, MilestoneType } from "../constants/enums.js";

/** 习惯 */
export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  startDate: string; // YYYY-MM-DD
  frequency: string;
  cueType: CueType;
  cueValue: string;
  stackedHabitId: string | null;
  reminderTime: string | null; // "HH:mm" or null
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** 打卡记录 */
export interface CheckIn {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  isRetroactive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 里程碑事件 */
export interface MilestoneEvent {
  id: string;
  habitId: string;
  type: MilestoneType;
  totalDays: number;
  completionRate: number;
  longestStreak: number;
  dismissed: boolean;
  createdAt: string;
}

/** 连续打卡断裂安慰记录 */
export interface StreakBreakEvent {
  id: string;
  habitId: string;
  breakDate: string; // YYYY-MM-DD
  comfortShown: boolean;
  createdAt: string;
}
