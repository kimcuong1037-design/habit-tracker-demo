import type { Habit } from "@habit-tracker/shared";

/**
 * ReminderScheduler — 前端定时检测提醒 (DD-014)
 *
 * 每 60 秒检查一次当前时间是否匹配某个习惯的 reminderTime，
 * 若匹配且该习惯今日未打卡，发送浏览器通知。
 * 使用 Set<habitId> 避免同一习惯一天内重复通知。
 */

type CheckedInFn = (habitId: string) => boolean;

export class ReminderScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private sentToday = new Set<string>();
  private lastResetDate = this.todayStr();
  private habits: Habit[] = [];
  private isCheckedIn: CheckedInFn = () => false;

  /** 请求浏览器通知权限 */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) return "denied";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return Notification.requestPermission();
  }

  /** 当前是否有通知权限 */
  static get hasPermission(): boolean {
    return "Notification" in window && Notification.permission === "granted";
  }

  /** 启动定时检测（60s 间隔） */
  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.check(), 60_000);
    // 立即检查一次
    this.check();
  }

  /** 停止定时检测 */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** 更新习惯列表和打卡状态检查函数 */
  update(habits: Habit[], isCheckedIn: CheckedInFn) {
    this.habits = habits;
    this.isCheckedIn = isCheckedIn;
  }

  /** 每分钟执行的检查逻辑 */
  private check() {
    // 日期翻转时重置已发送集合
    const today = this.todayStr();
    if (today !== this.lastResetDate) {
      this.sentToday.clear();
      this.lastResetDate = today;
    }

    if (!ReminderScheduler.hasPermission) return;

    const now = this.currentHHmm();

    for (const habit of this.habits) {
      if (!habit.reminderTime) continue;
      if (!habit.isActive) continue;
      if (this.sentToday.has(habit.id)) continue;
      if (this.isCheckedIn(habit.id)) continue;
      if (habit.reminderTime !== now) continue;

      this.notify(habit);
      this.sentToday.add(habit.id);
    }
  }

  /** 发送浏览器通知 */
  private notify(habit: Habit) {
    // 优先使用 Service Worker 注册的通知（支持后台）
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_REMINDER",
        payload: { title: habit.name, body: `该做「${habit.name}」了！` },
      });
      return;
    }

    // 回退到普通通知
    new Notification(`Habit Tracker`, {
      body: `该做「${habit.name}」了！`,
      tag: `reminder-${habit.id}`,
      icon: "/favicon.svg",
    });
  }

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  private currentHHmm(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
}
