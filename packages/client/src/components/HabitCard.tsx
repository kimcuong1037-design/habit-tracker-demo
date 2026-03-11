import { useState } from "react";
import { CueType } from "@habit-tracker/shared";
import type { HabitWithStreak } from "@habit-tracker/shared";
import { Card, CardContent } from "@/components/ui/card.js";
import { Checkbox } from "@/components/ui/checkbox.js";
import { Badge } from "@/components/ui/badge.js";

interface HabitCardProps {
  habit: HabitWithStreak;
  onCheckIn: (habitId: string) => Promise<void>;
}

export default function HabitCard({ habit, onCheckIn }: HabitCardProps) {
  const [optimisticChecked, setOptimisticChecked] = useState(habit.checkedInToday);
  const [loading, setLoading] = useState(false);

  // Sync optimistic state when prop changes
  if (habit.checkedInToday !== optimisticChecked && !loading) {
    setOptimisticChecked(habit.checkedInToday);
  }

  const cueLabel =
    habit.cueType === CueType.STACKING
      ? `🔗 ${habit.cueValue}`
      : `📍 ${habit.cueValue}`;

  const handleCheckIn = async () => {
    if (optimisticChecked || loading) return;
    setOptimisticChecked(true);
    setLoading(true);
    try {
      await onCheckIn(habit.id);
    } catch {
      setOptimisticChecked(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={`transition-opacity ${optimisticChecked ? "opacity-60" : ""}`}
    >
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <Checkbox
          checked={optimisticChecked}
          onCheckedChange={() => handleCheckIn()}
          disabled={optimisticChecked || loading}
          className="size-5"
        />

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${
              optimisticChecked
                ? "text-muted-foreground line-through"
                : "text-foreground"
            }`}
          >
            {habit.name}
          </p>
          <Badge variant="secondary" className="mt-1 text-xs">
            {cueLabel}
          </Badge>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-sm">
          <span>🔥</span>
          <span className="font-medium tabular-nums">{habit.currentStreak}</span>
        </div>
      </CardContent>
    </Card>
  );
}
