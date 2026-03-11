import { useState, useEffect } from "react";
import { CueType } from "@habit-tracker/shared";
import type { Habit, UpdateHabitRequest } from "@habit-tracker/shared";
import { updateHabit } from "@/api/habits.js";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.js";
import { Badge } from "@/components/ui/badge.js";
import ReminderTimePicker from "./ReminderTimePicker.js";

const TRIGGER_PRESETS = [
  "起床后",
  "刷牙后",
  "早餐后",
  "午餐后",
  "晚餐后",
  "到家后",
  "睡觉前",
];

interface EditHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit;
  onUpdated: () => void;
  existingHabits: Habit[];
}

export default function EditHabitDialog({
  open,
  onOpenChange,
  habit,
  onUpdated,
  existingHabits,
}: EditHabitDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cueType, setCueType] = useState<CueType>(CueType.TRIGGER);
  const [triggerValue, setTriggerValue] = useState("");
  const [customTrigger, setCustomTrigger] = useState("");
  const [stackedHabitId, setStackedHabitId] = useState("");
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill when habit changes or dialog opens
  useEffect(() => {
    if (open && habit) {
      setName(habit.name);
      setDescription(habit.description ?? "");
      setCueType(habit.cueType);
      if (habit.cueType === CueType.TRIGGER) {
        const isPreset = TRIGGER_PRESETS.includes(habit.cueValue);
        setTriggerValue(isPreset ? habit.cueValue : "");
        setCustomTrigger(isPreset ? "" : habit.cueValue);
      } else {
        setStackedHabitId(habit.stackedHabitId ?? "");
      }
      setReminderTime(habit.reminderTime ?? null);
    }
  }, [open, habit]);

  // Other active habits (exclude current)
  const stackableHabits = existingHabits.filter((h) => h.id !== habit.id);

  const selectedCueValue =
    cueType === CueType.TRIGGER
      ? triggerValue || customTrigger
      : stackableHabits.find((h) => h.id === stackedHabitId)?.name ?? "";

  const cueValid =
    cueType === CueType.TRIGGER
      ? (triggerValue || customTrigger.trim()).length > 0
      : stackedHabitId.length > 0;

  const hasChanges = () => {
    const newCueValue =
      cueType === CueType.TRIGGER
        ? triggerValue || customTrigger.trim()
        : stackableHabits.find((h) => h.id === stackedHabitId)?.name ?? "";
    return (
      name.trim() !== habit.name ||
      (description.trim() || "") !== (habit.description ?? "") ||
      cueType !== habit.cueType ||
      newCueValue !== habit.cueValue ||
      (cueType === CueType.STACKING &&
        stackedHabitId !== (habit.stackedHabitId ?? "")) ||
      reminderTime !== (habit.reminderTime ?? null)
    );
  };

  const handleSubmit = async () => {
    if (!cueValid || !hasChanges()) return;
    setSubmitting(true);
    try {
      const payload: UpdateHabitRequest = {};
      if (name.trim() !== habit.name) payload.name = name.trim();
      if ((description.trim() || "") !== (habit.description ?? ""))
        payload.description = description.trim() || undefined;
      if (cueType !== habit.cueType) payload.cueType = cueType;

      const newCueValue =
        cueType === CueType.TRIGGER
          ? triggerValue || customTrigger.trim()
          : stackableHabits.find((h) => h.id === stackedHabitId)!.name;
      if (newCueValue !== habit.cueValue) payload.cueValue = newCueValue;

      if (cueType === CueType.STACKING) {
        if (stackedHabitId !== (habit.stackedHabitId ?? ""))
          payload.stackedHabitId = stackedHabitId;
      } else if (habit.cueType === CueType.STACKING) {
        payload.stackedHabitId = null;
      }

      if (reminderTime !== (habit.reminderTime ?? null))
        payload.reminderTime = reminderTime;

      await updateHabit(habit.id, payload);
      toast.success(`习惯「${name.trim()}」已更新`);
      onOpenChange(false);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑习惯</DialogTitle>
          <DialogDescription>修改习惯信息和触发方式</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">习惯名称 *</label>
              <span className="text-xs text-muted-foreground">
                {name.length}/50
              </span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">描述（可选）</label>
              <span className="text-xs text-muted-foreground">
                {description.length}/200
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              rows={2}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/50"
            />
          </div>

          {/* Start date (read-only) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">开始日期</label>
            <div className="flex h-9 items-center rounded-lg border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
              {habit.startDate}
            </div>
          </div>

          {/* Reminder time */}
          <ReminderTimePicker value={reminderTime} onChange={setReminderTime} />

          {/* Cue section */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">触发方式</label>
            <p className="text-xs text-muted-foreground">
              调整触发场景有助于重新找到适合你的节奏
            </p>
          </div>

          <div className="space-y-5">
            {/* Trigger */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setCueType(CueType.TRIGGER)}
                className={`flex w-full items-center gap-2 text-sm font-medium ${
                  cueType === CueType.TRIGGER
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex size-4 items-center justify-center rounded-full border-2 ${
                    cueType === CueType.TRIGGER
                      ? "border-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {cueType === CueType.TRIGGER && (
                    <span className="size-2 rounded-full bg-primary" />
                  )}
                </span>
                A. 触发线索
              </button>

              {cueType === CueType.TRIGGER && (
                <div className="space-y-2 pl-6">
                  <div className="flex flex-wrap gap-2">
                    {TRIGGER_PRESETS.map((preset) => (
                      <Badge
                        key={preset}
                        variant={
                          triggerValue === preset ? "default" : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          setTriggerValue(
                            triggerValue === preset ? "" : preset,
                          );
                          setCustomTrigger("");
                        }}
                      >
                        {preset}
                      </Badge>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={customTrigger}
                    onChange={(e) => {
                      setCustomTrigger(e.target.value);
                      setTriggerValue("");
                    }}
                    placeholder="或输入自定义线索..."
                    className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/50"
                  />
                </div>
              )}
            </div>

            {/* Stacking */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  if (stackableHabits.length > 0) setCueType(CueType.STACKING);
                }}
                disabled={stackableHabits.length === 0}
                className={`flex w-full items-center gap-2 text-sm font-medium ${
                  stackableHabits.length === 0
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : cueType === CueType.STACKING
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex size-4 items-center justify-center rounded-full border-2 ${
                    stackableHabits.length === 0
                      ? "border-muted-foreground/50"
                      : cueType === CueType.STACKING
                        ? "border-primary"
                        : "border-muted-foreground"
                  }`}
                >
                  {cueType === CueType.STACKING && (
                    <span className="size-2 rounded-full bg-primary" />
                  )}
                </span>
                B. 习惯叠加
              </button>

              {cueType === CueType.STACKING && (
                <div className="space-y-2 pl-6">
                  {stackableHabits.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setStackedHabitId(h.id)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        stackedHabitId === h.id
                          ? "border-primary bg-primary/5"
                          : "border-input hover:bg-muted/50"
                      }`}
                    >
                      <span
                        className={`size-3 rounded-full border-2 ${
                          stackedHabitId === h.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      />
                      {h.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            {selectedCueValue && (
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">提示预览</p>
                <p className="mt-0.5 text-sm font-medium">
                  {cueType === CueType.TRIGGER
                    ? `📍 ${selectedCueValue} → ${name}`
                    : `🔗 做完「${selectedCueValue}」后 → ${name}`}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !cueValid || !hasChanges() || submitting}
          >
            {submitting ? "保存中..." : "保存修改"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
