import { useEffect, useRef } from "react";
import type { HabitWithStreak } from "@habit-tracker/shared";
import { ReminderScheduler } from "@/services/reminder.js";

/**
 * useReminder — 初始化并管理 ReminderScheduler 生命周期
 *
 * 在 HomePage mount 时启动，unmount 时停止。
 * 当 habits 数据变化时自动更新 scheduler。
 */
export function useReminder(habits: HabitWithStreak[]) {
  const schedulerRef = useRef<ReminderScheduler | null>(null);

  // 初始化 scheduler
  useEffect(() => {
    const scheduler = new ReminderScheduler();
    schedulerRef.current = scheduler;
    scheduler.start();
    return () => scheduler.stop();
  }, []);

  // 当 habits 变化时更新 scheduler 数据
  useEffect(() => {
    schedulerRef.current?.update(
      habits,
      (habitId) => habits.find((h) => h.id === habitId)?.checkedInToday ?? false,
    );
  }, [habits]);

  return {
    requestPermission: ReminderScheduler.requestPermission,
    hasPermission: ReminderScheduler.hasPermission,
  };
}
