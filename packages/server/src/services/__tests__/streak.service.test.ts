import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import dayjs from "dayjs";
import { calculateStreak, calculateLongestStreak } from "../streak.service.js";
import { createTestUser, createTestHabit, createTestCheckIn } from "../../__tests__/helpers.js";

describe("streak.service", () => {
  let habitId: string;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-12T12:00:00Z"));

    const { user } = await createTestUser();
    const habit = await createTestHabit(user.id);
    habitId = habit.id;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("calculateStreak", () => {
    it("returns 0 for no check-ins", async () => {
      const streak = await calculateStreak(habitId, "2026-03-12");
      expect(streak).toBe(0);
    });

    it("returns 1 for single check-in today", async () => {
      await createTestCheckIn(habitId, "2026-03-12");
      const streak = await calculateStreak(habitId, "2026-03-12");
      expect(streak).toBe(1);
    });

    it("counts continuous streak correctly", async () => {
      await createTestCheckIn(habitId, "2026-03-10");
      await createTestCheckIn(habitId, "2026-03-11");
      await createTestCheckIn(habitId, "2026-03-12");

      const streak = await calculateStreak(habitId, "2026-03-12");
      expect(streak).toBe(3);
    });

    it("breaks streak on gap", async () => {
      await createTestCheckIn(habitId, "2026-03-09");
      // 03-10 skipped
      await createTestCheckIn(habitId, "2026-03-11");
      await createTestCheckIn(habitId, "2026-03-12");

      const streak = await calculateStreak(habitId, "2026-03-12");
      expect(streak).toBe(2);
    });

    it("counts from yesterday if today not checked in", async () => {
      await createTestCheckIn(habitId, "2026-03-10");
      await createTestCheckIn(habitId, "2026-03-11");
      // 03-12 not checked in

      const streak = await calculateStreak(habitId, "2026-03-12");
      expect(streak).toBe(2);
    });
  });

  describe("calculateLongestStreak", () => {
    it("returns 0 for no check-ins", async () => {
      const longest = await calculateLongestStreak(habitId);
      expect(longest).toBe(0);
    });

    it("returns 1 for single check-in", async () => {
      await createTestCheckIn(habitId, "2026-03-12");
      const longest = await calculateLongestStreak(habitId);
      expect(longest).toBe(1);
    });

    it("returns longest run among non-contiguous check-ins", async () => {
      // First run: 3 days
      await createTestCheckIn(habitId, "2026-03-01");
      await createTestCheckIn(habitId, "2026-03-02");
      await createTestCheckIn(habitId, "2026-03-03");
      // Gap
      // Second run: 2 days
      await createTestCheckIn(habitId, "2026-03-10");
      await createTestCheckIn(habitId, "2026-03-11");

      const longest = await calculateLongestStreak(habitId);
      expect(longest).toBe(3);
    });
  });
});
