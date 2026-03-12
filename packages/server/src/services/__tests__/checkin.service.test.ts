import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MAX_RETROACTIVE_PER_MONTH } from "@habit-tracker/shared";
import * as checkinService from "../checkin.service.js";
import { AppError } from "../../middleware/error-handler.js";
import { createTestUser, createTestHabit, createTestCheckIn } from "../../__tests__/helpers.js";

describe("checkin.service", () => {
  let userId: string;
  let habitId: string;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T12:00:00Z"));

    const { user } = await createTestUser();
    userId = user.id;
    const habit = await createTestHabit(user.id, { startDate: "2026-01-01" });
    habitId = habit.id;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createCheckIn", () => {
    it("creates check-in for today", async () => {
      const result = await checkinService.createCheckIn(userId, habitId, {
        date: "2026-03-12",
      });

      expect(result.checkIn.date).toBe("2026-03-12");
      expect(result.checkIn.isRetroactive).toBe(false);
      expect(result.updatedStreak).toBeGreaterThanOrEqual(1);
    });

    it("creates retroactive check-in for yesterday", async () => {
      const result = await checkinService.createCheckIn(userId, habitId, {
        date: "2026-03-11",
      });

      expect(result.checkIn.isRetroactive).toBe(true);
    });

    it("throws 409 for duplicate check-in", async () => {
      await checkinService.createCheckIn(userId, habitId, { date: "2026-03-12" });

      await expect(
        checkinService.createCheckIn(userId, habitId, { date: "2026-03-12" }),
      ).rejects.toThrow(AppError);
    });

    it("throws 400 for date other than today or yesterday", async () => {
      await expect(
        checkinService.createCheckIn(userId, habitId, { date: "2026-03-10" }),
      ).rejects.toThrow(AppError);
    });

    it("throws 409 when retroactive quota exceeded", async () => {
      // Create multiple habits to use up retroactive quota
      for (let i = 0; i < MAX_RETROACTIVE_PER_MONTH; i++) {
        const h = await createTestHabit(userId, {
          name: `quota-habit-${i}`,
          startDate: "2026-01-01",
        });
        // Create retroactive check-ins on different dates within the month
        // Using raw createTestCheckIn to bypass the service's quota check
        await createTestCheckIn(h.id, `2026-03-0${i + 1}`, true);
      }

      // Now try to create another retroactive check-in via service
      await expect(
        checkinService.createCheckIn(userId, habitId, { date: "2026-03-11" }),
      ).rejects.toThrow(AppError);
    });

    it("returns milestone when threshold hit", async () => {
      // Create 6 prior check-ins (need 7 total for DAY_7 milestone)
      for (let i = 1; i <= 6; i++) {
        await createTestCheckIn(habitId, `2026-03-0${i}`);
      }

      // 7th check-in should trigger DAY_7 milestone
      const result = await checkinService.createCheckIn(userId, habitId, {
        date: "2026-03-12",
      });

      expect(result.milestone).not.toBeNull();
      expect(result.milestone!.type).toBe("7d");
    });
  });

  describe("getRetroactiveQuota", () => {
    it("returns correct used/remaining counts", async () => {
      await createTestCheckIn(habitId, "2026-03-11", true);

      const quota = await checkinService.getRetroactiveQuota(userId, "2026-03-12");

      expect(quota.used).toBe(1);
      expect(quota.remaining).toBe(MAX_RETROACTIVE_PER_MONTH - 1);
      expect(quota.limit).toBe(MAX_RETROACTIVE_PER_MONTH);
      expect(quota.month).toBe("2026-03");
    });

    it("returns full quota when none used", async () => {
      const quota = await checkinService.getRetroactiveQuota(userId);

      expect(quota.used).toBe(0);
      expect(quota.remaining).toBe(MAX_RETROACTIVE_PER_MONTH);
    });
  });
});
