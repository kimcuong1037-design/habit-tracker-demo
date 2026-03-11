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
  totalCheckIns: number;
  checkedInToday: boolean;
  canRetroactive: boolean;
}

export interface TodayResponse {
  data: {
    progress: {
      total: number;
      completed: number;
      allDone: boolean;
    };
    habits: HabitWithStreak[];
    encouragement: {
      message: string;
      source: "ai" | "fallback";
    } | null;
    retroactiveQuota: {
      month: string;
      used: number;
      limit: number;
      remaining: number;
    };
    pendingStreakBreaks: Array<{
      id: string;
      habitId: string;
      habitName: string;
      breakDate: string;
    }>;
    pendingMilestones: Array<{
      id: string;
      habitId: string;
      habitName: string;
      type: string;
      totalDays: number;
      completionRate: number;
      longestStreak: number;
    }>;
  };
}

export interface CheckInResponse {
  data: {
    checkIn: CheckIn;
    updatedStreak: number;
    milestone: MilestoneEvent | null;
  };
}
