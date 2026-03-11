import { useState, useEffect, useCallback } from "react";
import dayjs, { type Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";
import type { Habit, CheckIn } from "@habit-tracker/shared";
import { listHabits, listCheckIns } from "@/api/habits.js";

dayjs.extend(isoWeek);

export interface WeekHabitRow {
  habit: Habit;
  /** Check-in status for each day of the week (Mon=0 … Sun=6) */
  days: (CheckIn | null)[];
}

export interface WeekData {
  weekStart: Dayjs;
  weekEnd: Dayjs;
  dates: Dayjs[];
  rows: WeekHabitRow[];
  /** completion rate for the week (0–100) */
  completionRate: number;
}

/** Returns ISO week dates (Mon–Sun) for a given week start */
function getWeekDates(weekStart: Dayjs): Dayjs[] {
  return Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));
}

export function useWeekData(weekStart: Dayjs) {
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const weekKey = weekStart.format("YYYY-MM-DD");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ws = dayjs(weekKey);
      const we = ws.add(6, "day");
      const dates = getWeekDates(ws);
      const from = ws.format("YYYY-MM-DD");
      const to = we.format("YYYY-MM-DD");

      // Fetch active habits
      const habitsRes = await listHabits({ active: true });
      const habits = habitsRes.data;

      // Fetch check-ins for all habits in parallel
      const checkInsResults = await Promise.all(
        habits.map((h) => listCheckIns(h.id, { from, to })),
      );

      const today = dayjs().format("YYYY-MM-DD");
      let totalSlots = 0;
      let checkedSlots = 0;

      const rows: WeekHabitRow[] = habits.map((habit, idx) => {
        const checkIns = checkInsResults[idx].data;
        const checkInMap = new Map(checkIns.map((ci) => [ci.date, ci]));

        const days = dates.map((date) => {
          const dateStr = date.format("YYYY-MM-DD");
          // Only count slots from startDate up to today
          if (dateStr >= habit.startDate && dateStr <= today) {
            totalSlots++;
            if (checkInMap.has(dateStr)) {
              checkedSlots++;
            }
          }
          return checkInMap.get(dateStr) ?? null;
        });

        return { habit, days };
      });

      const completionRate =
        totalSlots > 0 ? Math.round((checkedSlots / totalSlots) * 100) : 0;

      setData({ weekStart: ws, weekEnd: we, dates, rows, completionRate });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [weekKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
