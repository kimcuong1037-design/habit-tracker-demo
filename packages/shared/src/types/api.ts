import type { CueType } from "../constants/enums.js";
import type { Habit, CheckIn, MilestoneEvent, StreakBreakEvent } from "./models.js";

// ── Request DTOs ──

export interface CreateHabitRequest {
  name: string;
  description?: string;
  startDate: string;
  cueType: CueType;
  cueValue: string;
  stackedHabitId?: string;
}

export interface UpdateHabitRequest {
  name?: string;
  description?: string;
  cueType?: CueType;
  cueValue?: string;
  stackedHabitId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateCheckInRequest {
  date: string;
}

// ── Response DTOs ──

export interface HabitWithStreak extends Habit {
  currentStreak: number;
  longestStreak: number;
}

export interface TodayHabitItem {
  habit: HabitWithStreak;
  checkedIn: boolean;
}

export interface TodayResponse {
  data: {
    date: string;
    habits: TodayHabitItem[];
    completedCount: number;
    totalCount: number;
    pendingMilestones: MilestoneEvent[];
    streakBreaks: StreakBreakEvent[];
    retroactiveQuota: {
      used: number;
      max: number;
    };
  };
}

export interface CheckInResponse {
  data: {
    checkIn: CheckIn;
    currentStreak: number;
    milestone: MilestoneEvent | null;
  };
}
