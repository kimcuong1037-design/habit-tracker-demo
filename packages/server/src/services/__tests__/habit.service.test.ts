import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CueType, MAX_ACTIVE_HABITS } from "@habit-tracker/shared";
import * as habitService from "../habit.service.js";
import { AppError } from "../../middleware/error-handler.js";
import { createTestUser, createTestHabit, createTestCheckIn } from "../../__tests__/helpers.js";

describe("habit.service", () => {
  let userId: string;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T12:00:00Z"));

    const { user } = await createTestUser();
    userId = user.id;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createHabit", () => {
    it("creates habit with correct fields", async () => {
      const habit = await habitService.createHabit(userId, {
        name: "冥想",
        startDate: "2026-03-12",
        cueType: CueType.TRIGGER,
        cueValue: "早餐后",
      });

      expect(habit.name).toBe("冥想");
      expect(habit.userId).toBe(userId);
      expect(habit.cueType).toBe("trigger");
      expect(habit.isActive).toBe(true);
    });

    it("enforces MAX_ACTIVE_HABITS limit", async () => {
      // Create max habits
      for (let i = 0; i < MAX_ACTIVE_HABITS; i++) {
        await createTestHabit(userId, { name: `习惯${i}` });
      }

      await expect(
        habitService.createHabit(userId, {
          name: "超限习惯",
          startDate: "2026-03-12",
          cueType: CueType.TRIGGER,
          cueValue: "测试",
        }),
      ).rejects.toThrow(AppError);
    });

    it("throws 404 for invalid stackedHabitId", async () => {
      await expect(
        habitService.createHabit(userId, {
          name: "叠加习惯",
          startDate: "2026-03-12",
          cueType: CueType.STACKING,
          cueValue: "测试",
          stackedHabitId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      ).rejects.toThrow(AppError);
    });
  });

  describe("listHabits", () => {
    it("returns enriched habits with computed fields", async () => {
      const habit = await createTestHabit(userId, { startDate: "2026-03-10" });
      await createTestCheckIn(habit.id, "2026-03-12");

      const habits = await habitService.listHabits(userId, { date: "2026-03-12" });

      expect(habits).toHaveLength(1);
      expect(habits[0].checkedInToday).toBe(true);
      expect(habits[0].currentStreak).toBe(1);
      expect(habits[0].totalCheckIns).toBe(1);
    });

    it("only returns habits for the requesting user", async () => {
      await createTestHabit(userId);
      const { user: otherUser } = await createTestUser();
      await createTestHabit(otherUser.id, { name: "别人的习惯" });

      const habits = await habitService.listHabits(userId, {});
      expect(habits).toHaveLength(1);
    });
  });

  describe("getHabit", () => {
    it("returns habit with computed fields", async () => {
      const habit = await createTestHabit(userId);
      const result = await habitService.getHabit(userId, habit.id);

      expect(result.id).toBe(habit.id);
      expect(result.currentStreak).toBeDefined();
      expect(result.longestStreak).toBeDefined();
      expect(result.totalCheckIns).toBeDefined();
    });

    it("throws 404 for non-existent habit", async () => {
      await expect(
        habitService.getHabit(userId, "non-existent-id"),
      ).rejects.toThrow(AppError);
    });

    it("throws 404 when accessing another user's habit", async () => {
      const { user: otherUser } = await createTestUser();
      const otherHabit = await createTestHabit(otherUser.id);

      await expect(
        habitService.getHabit(userId, otherHabit.id),
      ).rejects.toThrow(AppError);
    });
  });

  describe("deleteHabit", () => {
    it("deletes habit successfully", async () => {
      const habit = await createTestHabit(userId);
      await habitService.deleteHabit(userId, habit.id);

      await expect(
        habitService.getHabit(userId, habit.id),
      ).rejects.toThrow(AppError);
    });

    it("throws 404 for non-existent habit", async () => {
      await expect(
        habitService.deleteHabit(userId, "non-existent"),
      ).rejects.toThrow(AppError);
    });
  });
});
