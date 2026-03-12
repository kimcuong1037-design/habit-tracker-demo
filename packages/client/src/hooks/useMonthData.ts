import { useState, useEffect, useCallback } from "react";
import dayjs, { type Dayjs } from "dayjs";
import type { Habit, CheckIn } from "@habit-tracker/shared";
import { listHabits, listCheckIns } from "@/api/habits.js";

export interface MonthDayCell {
  date: string; // YYYY-MM-DD
  /** Number of habits checked in on this day */
  checked: number;
  /** Number of active habits on this day (started before or on this date) */
  total: number;
  /** Intensity level 0–4 for heatmap coloring */
  level: number;
}

export interface MonthData {
  month: Dayjs;
  /** All day cells for the month grid (may include padding days from prev/next month) */
  cells: MonthDayCell[];
  /** Day-of-week offset for the 1st of the month (0=Mon … 6=Sun) */
  startOffset: number;
  /** Total days in the month */
  daysInMonth: number;
  /** Overall completion rate for the month (0–100) */
  completionRate: number;
  /** Number of days with at least one check-in */
  activeDays: number;
}

/** Map a completion ratio (0–1) to a heatmap level (0–4) */
function toLevel(checked: number, total: number): number {
  if (total === 0) return 0;
  const ratio = checked / total;
  if (ratio === 0) return 0;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function useMonthData(month: Dayjs) {
  const [data, setData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const monthKey = month.format("YYYY-MM");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const monthStart = dayjs(monthKey + "-01");
      const daysInMonth = monthStart.daysInMonth();
      const monthEnd = monthStart.endOf("month");
      const from = monthStart.format("YYYY-MM-DD");
      const to = monthEnd.format("YYYY-MM-DD");

      // Monday=0 … Sunday=6
      const startOffset = (monthStart.day() + 6) % 7;

      const habitsRes = await listHabits({ active: true });
      const habits: Habit[] = habitsRes.data;

      // Fetch check-ins for all habits in the month, in parallel
      const checkInsResults = await Promise.all(
        habits.map((h) => listCheckIns(h.id, { from, to })),
      );

      // Build per-date maps: { date -> Set<habitId> } for check-ins
      const checkInsByDate = new Map<string, Set<string>>();
      checkInsResults.forEach((res, idx) => {
        const habitId = habits[idx].id;
        for (const ci of res.data) {
          if (!checkInsByDate.has(ci.date)) {
            checkInsByDate.set(ci.date, new Set());
          }
          checkInsByDate.get(ci.date)!.add(habitId);
        }
      });

      const today = dayjs().format("YYYY-MM-DD");
      let totalSlots = 0;
      let checkedSlots = 0;
      let activeDays = 0;

      const cells: MonthDayCell[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = monthStart.date(d).format("YYYY-MM-DD");
        // Count how many habits are active on this date
        const activeHabits = habits.filter((h) => h.startDate <= dateStr);
        const total = dateStr <= today ? activeHabits.length : 0;
        const checkedSet = checkInsByDate.get(dateStr);
        const checked = checkedSet
          ? activeHabits.filter((h) => checkedSet.has(h.id)).length
          : 0;

        if (total > 0) {
          totalSlots += total;
          checkedSlots += checked;
        }
        if (checked > 0) activeDays++;

        cells.push({
          date: dateStr,
          checked,
          total,
          level: toLevel(checked, total),
        });
      }

      const completionRate =
        totalSlots > 0 ? Math.round((checkedSlots / totalSlots) * 100) : 0;

      setData({
        month: monthStart,
        cells,
        startOffset,
        daysInMonth,
        completionRate,
        activeDays,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
