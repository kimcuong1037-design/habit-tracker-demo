import { useState } from "react";
import dayjs from "dayjs";
import { CueType } from "@habit-tracker/shared";
import type { CreateHabitRequest, Habit } from "@habit-tracker/shared";
import { createHabit } from "@/api/habits.js";
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

interface CreateHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  existingHabits: Habit[];
}

export default function CreateHabitDialog({
  open,
  onOpenChange,
  onCreated,
  existingHabits,
}: CreateHabitDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));

  // Step 2 fields
  const [cueType, setCueType] = useState<CueType>(CueType.TRIGGER);
  const [triggerValue, setTriggerValue] = useState("");
  const [customTrigger, setCustomTrigger] = useState("");
  const [stackedHabitId, setStackedHabitId] = useState("");

  const [reminderTime, setReminderTime] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setStartDate(dayjs().format("YYYY-MM-DD"));
    setCueType(CueType.TRIGGER);
    setTriggerValue("");
    setCustomTrigger("");
    setStackedHabitId("");
    setReminderTime(null);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const selectedCueValue =
    cueType === CueType.TRIGGER
      ? triggerValue || customTrigger
      : existingHabits.find((h) => h.id === stackedHabitId)?.name ?? "";

  const cueValid =
    cueType === CueType.TRIGGER
      ? (triggerValue || customTrigger.trim()).length > 0
      : stackedHabitId.length > 0;

  const handleSubmit = async () => {
    if (!cueValid) return;
    setSubmitting(true);
    try {
      const payload: CreateHabitRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        startDate,
        cueType,
        cueValue:
          cueType === CueType.TRIGGER
            ? triggerValue || customTrigger.trim()
            : existingHabits.find((h) => h.id === stackedHabitId)!.name,
        stackedHabitId:
          cueType === CueType.STACKING ? stackedHabitId : undefined,
        reminderTime: reminderTime ?? undefined,
      };
      await createHabit(payload);
      toast.success(`习惯「${name.trim()}」创建成功！`);
      handleOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "创建失败，请重试",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "创建新习惯" : "设置提示线索"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "第 1 步 / 共 2 步 — 基本信息"
              : "第 2 步 / 共 2 步 — 选择触发方式"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
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
                placeholder="例如：每天阅读 20 分钟"
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
                onChange={(e) =>
                  setDescription(e.target.value.slice(0, 200))
                }
                placeholder="为什么想培养这个习惯？"
                rows={2}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/50"
              />
            </div>

            {/* Start date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">开始日期</label>
              <input
                type="date"
                value={startDate}
                min={dayjs().format("YYYY-MM-DD")}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/50"
              />
            </div>

            {/* Reminder time */}
            <ReminderTimePicker value={reminderTime} onChange={setReminderTime} />

            {/* Frequency (locked) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">频率</label>
              <div className="flex h-9 items-center rounded-lg border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                每日
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Section A: Trigger */}
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

            {/* Section B: Stacking */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  if (existingHabits.length > 0) setCueType(CueType.STACKING);
                }}
                disabled={existingHabits.length === 0}
                className={`flex w-full items-center gap-2 text-sm font-medium ${
                  existingHabits.length === 0
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : cueType === CueType.STACKING
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex size-4 items-center justify-center rounded-full border-2 ${
                    existingHabits.length === 0
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
              {existingHabits.length === 0 && (
                <p className="pl-6 text-xs text-muted-foreground">
                  习惯叠加可将新习惯绑定到已有习惯之后执行，帮助你更自然地养成新习惯。创建第一个习惯后即可使用。
                </p>
              )}

              {cueType === CueType.STACKING && (
                <div className="space-y-2 pl-6">
                  {existingHabits.length > 0 ? (
                    existingHabits.map((h) => (
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
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      创建第一个习惯后即可使用习惯叠加
                    </p>
                  )}
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
        )}

        <DialogFooter>
          {step === 2 && (
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={submitting}
            >
              ← 上一步
            </Button>
          )}

          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
            >
              下一步 →
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!cueValid || submitting}>
              {submitting ? "创建中..." : "创建习惯 ✓"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
